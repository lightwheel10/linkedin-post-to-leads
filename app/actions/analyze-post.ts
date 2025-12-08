"use server";

import { ApifyClient } from 'apify-client';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import { canAnalyze, incrementAnalysisUsage, getScrapingCaps, UsageInfo } from '@/lib/usage';

// ============================================================================
// TYPES
// ============================================================================

export interface PostData {
    author: string;
    authorHeadline?: string;
    content: string;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    image?: string;
    postImage?: string;
    postUrl: string;
    activityId?: string;
}

export interface Reactor {
    name: string;
    headline: string;
    profileUrl: string;
    profilePicture?: string;
    reactionType: string;
}

interface PostFetchResult {
    success: boolean;
    post?: PostData;
    error?: string;
    usage?: UsageInfo;
    limitReached?: boolean;
}

interface ReactionsFetchResult {
    success: boolean;
    reactors?: Reactor[];
    error?: string;
}

// Commenter uses same structure as Reactor for consistency
export interface Commenter {
    name: string;
    headline: string;
    profileUrl: string;
    profilePicture?: string;
    commentText: string;
}

interface CommentsFetchResult {
    success: boolean;
    commenters?: Commenter[];
    error?: string;
}

interface AnalysisResult {
    success: boolean;
    data?: {
        post: PostData;
        reactors: Reactor[];
        totalReactors: number;
    };
    error?: string;
    usage?: UsageInfo;
    limitReached?: boolean;
}

// Initialize Apify client
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// ============================================================================
// STEP 1: Fetch Post Details Only
// ============================================================================

export async function fetchPostDetails(url: string): Promise<PostFetchResult> {
    try {
        console.log("=== STEP 1: FETCHING POST DETAILS ===");
        console.log("Input URL:", url);

        // Check authentication and usage limits
        const userEmail = await getAuthenticatedUser();
        
        if (!userEmail) {
            return {
                success: false,
                error: "Please log in to analyze posts",
                limitReached: false
            };
        }

        const user = await getOrCreateUser(userEmail);
        
        // Check if user can analyze
        const usageCheck = await canAnalyze(user.id);
        if (!usageCheck.allowed) {
            return {
                success: false,
                error: usageCheck.reason || "You've reached your analysis limit for this month.",
                usage: usageCheck.usage,
                limitReached: true
            };
        }

        // Fetch post details using Apify Post Scraper
        console.log("🔍 Fetching post details...");
        const postRun = await apifyClient.actor("d0DhjXPjkkwm4W5xK").call({
            post_urls: [url]
        });

        const { items: postItems } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();

        if (!postItems || postItems.length === 0) {
            throw new Error("Could not fetch post data. Please ensure it's a valid public LinkedIn post URL.");
        }

        const postData = postItems[0] as any;
        console.log("✅ Post fetched:", postData.author?.name);

        // Extract activity ID from URL or use the post ID
        let activityId = "";
        const activityMatch = url.match(/activity[:\-](\d+)/);
        if (activityMatch && activityMatch[1]) {
            activityId = activityMatch[1];
        } else if (postData.post?.id) {
            activityId = postData.post.id;
        }

        // Extract image
        let fetchedImage: string | undefined;
        
        if (postData.media && Array.isArray(postData.media) && postData.media.length > 0) {
             const firstMedia = postData.media[0];
             if (typeof firstMedia === 'object' && firstMedia && 'url' in firstMedia) {
                 fetchedImage = firstMedia.url;
             }
        }
        if (!fetchedImage && postData.post?.images && Array.isArray(postData.post.images) && postData.post.images.length > 0) {
            const firstImage = postData.post.images[0];
            if (typeof firstImage === 'string') {
                fetchedImage = firstImage;
            } else if (typeof firstImage === 'object' && firstImage && 'url' in firstImage) {
                fetchedImage = firstImage.url;
            }
        }
        if (!fetchedImage && postData.post?.img) {
            fetchedImage = postData.post.img;
        }
        if (!fetchedImage && postData.image) {
            fetchedImage = postData.image;
        }

        const post: PostData = {
            author: postData.author?.name || "Unknown Author",
            authorHeadline: postData.author?.headline,
            content: postData.post?.text || "",
            totalReactions: postData.stats?.total_reactions || 0,
            totalComments: postData.stats?.comments || 0,
            totalShares: postData.stats?.shares || 0,
            image: postData.author?.profile_picture,
            postImage: fetchedImage,
            postUrl: url,
            activityId: activityId
        };

        console.log("✅ Post details complete");
        return { success: true, post };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("❌ Post fetch error:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// STEP 2: Fetch Reactions (using LinkedIn Post Reactions Scraper)
// ============================================================================

export async function fetchReactions(postUrl: string): Promise<ReactionsFetchResult> {
    try {
        console.log("=== STEP 2: FETCHING REACTIONS ===");
        console.log("Post URL:", postUrl);

        const userEmail = await getAuthenticatedUser();
        if (!userEmail) {
            return { success: false, error: "Please log in" };
        }

        const user = await getOrCreateUser(userEmail);
        const caps = await getScrapingCaps(user.id);
        console.log(`📊 Reaction cap: ${caps.reactionCap}`);

        // Using the new LinkedIn Post Reactions Scraper (S6mgSO5lezSZKi0zN)
        const reactionsRun = await apifyClient.actor("S6mgSO5lezSZKi0zN").call({
            posts: [postUrl],
            maxItems: caps.reactionCap,
            profileScraperMode: "short"
        });

        const { items: reactionItems } = await apifyClient.dataset(reactionsRun.defaultDatasetId).listItems();
        console.log(`✅ Fetched ${reactionItems.length} reactions`);

        // Map the new scraper's output format to our Reactor interface
        // New scraper returns: { actor: { name, position, linkedinUrl, pictureUrl }, reactionType }
        const reactors: Reactor[] = reactionItems.map((item: any) => ({
            name: item.actor?.name || "Unknown",
            headline: item.actor?.position || "",
            profileUrl: item.actor?.linkedinUrl || "",
            profilePicture: item.actor?.pictureUrl || item.actor?.picture?.url || "",
            reactionType: item.reactionType || "LIKE"
        }));

        return { success: true, reactors };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("❌ Reactions fetch error:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// STEP 2B: Fetch Comments (using LinkedIn Post Comments Scraper)
// ============================================================================

export async function fetchComments(postUrl: string): Promise<CommentsFetchResult> {
    try {
        console.log("=== STEP 2B: FETCHING COMMENTS ===");
        console.log("Post URL:", postUrl);

        const userEmail = await getAuthenticatedUser();
        if (!userEmail) {
            return { success: false, error: "Please log in" };
        }

        const user = await getOrCreateUser(userEmail);
        const caps = await getScrapingCaps(user.id);
        console.log(`📊 Comment cap: ${caps.commentCap}`);

        // Using LinkedIn Post Comments Scraper (ZI6ykbLlGS3APaPE8)
        const commentsRun = await apifyClient.actor("ZI6ykbLlGS3APaPE8").call({
            posts: [postUrl],
            maxItems: caps.commentCap,
            profileScraperMode: "short"
        });

        const { items: commentItems } = await apifyClient.dataset(commentsRun.defaultDatasetId).listItems();
        console.log(`✅ Fetched ${commentItems.length} comments`);

        // Map the scraper's output format to our Commenter interface
        // Comment scraper returns: { actor: { name, position, linkedinUrl, pictureUrl }, commentary }
        const commenters: Commenter[] = commentItems.map((item: any) => ({
            name: item.actor?.name || "Unknown",
            headline: item.actor?.position || "",
            profileUrl: item.actor?.linkedinUrl || "",
            profilePicture: item.actor?.pictureUrl || item.actor?.picture?.url || "",
            commentText: item.commentary || ""
        }));

        return { success: true, commenters };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("❌ Comments fetch error:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// STEP 3: Track Usage (call after successful analysis)
// ============================================================================

export async function trackAnalysisUsage(
    postUrl: string, 
    reactorsCount: number, 
    commentersCount: number = 0
): Promise<UsageInfo | null> {
    try {
        const userEmail = await getAuthenticatedUser();
        if (!userEmail) return null;

        const user = await getOrCreateUser(userEmail);
        
        await incrementAnalysisUsage(user.id, {
            postUrl,
            reactionsScraped: reactorsCount,
            commentsScraped: commentersCount,
            leadsFound: reactorsCount + commentersCount
        });

        const updatedUsage = await canAnalyze(user.id);
        return updatedUsage.usage || null;

    } catch (error) {
        console.error("Failed to track usage:", error);
        return null;
    }
}

// ============================================================================
// LEGACY: Combined function (kept for backwards compatibility)
// ============================================================================

export async function analyzePost(url: string): Promise<AnalysisResult> {
    // Step 1: Fetch post
    const postResult = await fetchPostDetails(url);
    if (!postResult.success || !postResult.post) {
        return {
            success: false,
            error: postResult.error,
            usage: postResult.usage,
            limitReached: postResult.limitReached
        };
    }

    // Step 2: Fetch reactions (now uses full post URL instead of activity ID)
    const reactionsResult = await fetchReactions(postResult.post.postUrl);
    if (!reactionsResult.success || !reactionsResult.reactors) {
        return {
            success: false,
            error: reactionsResult.error
        };
    }

    // Step 3: Track usage
    const usage = await trackAnalysisUsage(url, reactionsResult.reactors.length);

    return {
        success: true,
        data: {
            post: postResult.post,
            reactors: reactionsResult.reactors,
            totalReactors: postResult.post.totalReactions
        },
        usage: usage || undefined
    };
}

// Helper function to filter reactors based on ICP criteria
export async function filterByICP(reactors: Reactor[], icpCriteria?: string[]): Promise<Reactor[]> {
    // Simple ICP filtering based on job titles
    const defaultKeywords = [
        'ceo', 'cto', 'founder', 'director', 'vp', 'vice president',
        'head of', 'chief', 'manager', 'lead', 'senior', 'principal'
    ];

    const keywords = icpCriteria || defaultKeywords;

    return reactors.filter(reactor => {
        const headline = reactor.headline.toLowerCase();
        return keywords.some(keyword => headline.includes(keyword));
    });
}
