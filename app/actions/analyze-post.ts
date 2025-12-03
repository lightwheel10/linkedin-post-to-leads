"use server";

import { ApifyClient } from 'apify-client';

// Apify Response Types
interface ApifyPostResponse {
    post?: {
        id?: string;
        text?: string;
        images?: (string | { url: string })[];
        img?: string;
    };
    author?: {
        name?: string;
        headline?: string;
        profile_picture?: string;
    };
    stats?: {
        total_reactions?: number;
        comments?: number;
        shares?: number;
    };
}

interface ApifyReactorResponse {
    reactor?: {
        name?: string;
        headline?: string;
        profile_url?: string;
        profile_pictures?: {
            small?: string;
            medium?: string;
            large?: string;
        };
    };
    reaction_type?: string;
}

interface PostData {
    author: string;
    authorHeadline?: string;
    content: string;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    image?: string;
    postImage?: string;
    postUrl: string;
}

interface Reactor {
    name: string;
    headline: string;
    profileUrl: string;
    profilePicture?: string;
    reactionType: string;
}

interface AnalysisResult {
    success: boolean;
    data?: {
        post: PostData;
        reactors: Reactor[];
        totalReactors: number;
    };
    error?: string;
}

// Initialize Apify client
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export async function analyzePost(url: string): Promise<AnalysisResult> {
    try {
        console.log("=== STARTING REAL LINKEDIN ANALYSIS ===");
        console.log("Input URL:", url);

        // Step 1: Fetch post details using Apify Post Scraper
        console.log("\n1️⃣ Fetching post details...");
        const postRun = await apifyClient.actor("d0DhjXPjkkwm4W5xK").call({
            post_urls: [url]
        });

        const { items: postItems } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();

        if (!postItems || postItems.length === 0) {
            throw new Error("Could not fetch post data. Please ensure it's a valid public LinkedIn post URL.");
        }

        const postData = postItems[0] as any;
        console.log("✅ Post fetched:", postData.author?.name);
        console.log("🔍 Raw Post Data Keys:", Object.keys(postData));
        if (postData.post) console.log("🔍 Raw Post Object Keys:", Object.keys(postData.post));
        if (postData.post?.images) console.log("🔍 Raw Post Images:", JSON.stringify(postData.post.images, null, 2));
        
        // Step 2: Fetch reactions using Apify Reactions Scraper
        console.log("\n2️⃣ Fetching post reactions...");

        // Extract activity ID from URL or use the post ID
        let activityId = "";
        const activityMatch = url.match(/activity[:\-](\d+)/);
        if (activityMatch && activityMatch[1]) {
            activityId = activityMatch[1];
        } else if (postData.post?.id) {
            activityId = postData.post.id;
        }

        const reactionsRun = await apifyClient.actor("J9UfswnR3Kae4O6vm").call({
            post_urls: [activityId],
            page_number: 1,
            reaction_type: "ALL",
            limit: 100 // Limit to first 100 for demo/cost control
        });

        const { items: reactionItems } = await apifyClient.dataset(reactionsRun.defaultDatasetId).listItems();
        console.log(`✅ Fetched ${reactionItems.length} reactions`);

        // Helper to safely extract image
        let fetchedImage: string | undefined;
        
        // Case 1: 'media' array at root (COMMON CASE)
        if (postData.media && Array.isArray(postData.media) && postData.media.length > 0) {
             const firstMedia = postData.media[0];
             if (typeof firstMedia === 'object' && firstMedia && 'url' in firstMedia) {
                 fetchedImage = firstMedia.url;
             }
        }

        // Case 2: 'images' array in post object (Legacy/Alternative)
        if (!fetchedImage && postData.post?.images && Array.isArray(postData.post.images) && postData.post.images.length > 0) {
            const firstImage = postData.post.images[0];
            if (typeof firstImage === 'string') {
                fetchedImage = firstImage;
            } else if (typeof firstImage === 'object' && firstImage && 'url' in firstImage) {
                fetchedImage = firstImage.url;
            }
        }
        
        // Case 3: 'img' property in post
        if (!fetchedImage && postData.post?.img) {
            fetchedImage = postData.post.img;
        }

        // Case 4: Check root level 'image' or 'images' if structure is different
        if (!fetchedImage && postData.image) {
            fetchedImage = postData.image;
        }
        
        console.log("🖼️ Extracted Image URL:", fetchedImage);

        // Step 3: Transform data
        const post: PostData = {
            author: postData.author?.name || "Unknown Author",
            authorHeadline: postData.author?.headline,
            content: postData.post?.text || "",
            totalReactions: postData.stats?.total_reactions || 0,
            totalComments: postData.stats?.comments || 0,
            totalShares: postData.stats?.shares || 0,
            image: postData.author?.profile_picture,
            postImage: fetchedImage,
            postUrl: url
        };

        const reactors: Reactor[] = reactionItems.map((item) => {
            const reactor = item as ApifyReactorResponse;
            return {
                name: reactor.reactor?.name || "Unknown",
                headline: reactor.reactor?.headline || "",
                profileUrl: reactor.reactor?.profile_url || "",
                profilePicture: reactor.reactor?.profile_pictures?.medium || reactor.reactor?.profile_pictures?.small || "",
                reactionType: reactor.reaction_type || "LIKE"
            };
        });

        console.log("\n=== ANALYSIS COMPLETE ===");
        console.log("Post:", post.author);
        console.log("Total Reactions:", post.totalReactions);
        console.log("Fetched Reactors:", reactors.length);

        return {
            success: true,
            data: {
                post,
                reactors,
                totalReactors: post.totalReactions
            }
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("=== ERROR ===", errorMessage);

        return {
            success: false,
            error: errorMessage
        };
    }
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
