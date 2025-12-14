/**
 * Google Analytics 4 Event Tracking Utility
 *
 * This module provides type-safe functions for tracking custom events in GA4.
 * All events are sent via gtag() which is initialized in app/layout.tsx.
 *
 * SETUP:
 * - GA4 Measurement ID: G-KFXCL8CNYP (configured in app/layout.tsx)
 * - Events will appear in GA4 under Admin → Events → Recent events
 * - Mark important events as "Key Events" (conversions) in GA4 dashboard
 *
 * EVENT NAMING CONVENTION:
 * - Use snake_case for event names (e.g., signup_cta_click)
 * - Use snake_case for parameter names (e.g., button_location)
 * - Keep names descriptive but concise
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/events
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      targetId: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Core event tracking function
 * Safely calls gtag() only if it exists (prevents errors if GA fails to load)
 *
 * @param eventName - The name of the event (will appear in GA4 Events)
 * @param params - Optional parameters to attach to the event
 */
function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// =============================================================================
// TIER 1: CRITICAL EVENTS (Primary Conversions)
// =============================================================================

/**
 * Track CTA button clicks that lead to signup
 * Use this for all "Get Started", "Start Free Trial", etc. buttons
 *
 * @param source - Where the button is located (hero, navbar, pricing, cta, calculator, blog)
 * @param buttonText - The actual text on the button
 * @param plan - Optional: which pricing plan (for pricing page CTAs)
 *
 * @example
 * trackSignupCTAClick('hero', 'Start Free Trial')
 * trackSignupCTAClick('pricing', 'Start 7-Day Free Trial', 'growth')
 */
export function trackSignupCTAClick(
  source: 'hero' | 'navbar' | 'pricing' | 'cta' | 'calculator' | 'blog',
  buttonText: string,
  plan?: string
): void {
  trackEvent('signup_cta_click', {
    button_location: source,
    button_text: buttonText,
    ...(plan && { pricing_plan: plan }),
  });
}

/**
 * Track which authentication method users choose
 * Only tracking Google and Email (LinkedIn removed as per requirements)
 *
 * @param method - The auth method selected
 * @param context - Whether this is login or signup
 *
 * @example
 * trackSignupMethod('google', 'signup')
 * trackSignupMethod('email', 'login')
 */
export function trackSignupMethod(
  method: 'google' | 'email',
  context: 'signup' | 'login'
): void {
  trackEvent('signup_method', {
    auth_method: method,
    auth_context: context,
  });
}

/**
 * Track when a user starts the demo by analyzing a post
 * Fired when user clicks "Analyze Post" with a valid URL
 *
 * @example
 * trackDemoStarted()
 */
export function trackDemoStarted(): void {
  trackEvent('demo_started', {
    demo_type: 'post_analysis',
  });
}

/**
 * Track when a user completes the demo (reaches the qualified leads step)
 * This indicates high buying intent
 *
 * @param leadsFound - Number of leads found in the demo
 *
 * @example
 * trackDemoCompleted(25)
 */
export function trackDemoCompleted(leadsFound: number): void {
  trackEvent('demo_completed', {
    leads_found: leadsFound,
  });
}

// =============================================================================
// TIER 2: HIGH VALUE EVENTS
// =============================================================================

/**
 * Track when user views the pricing section
 * Triggered via Intersection Observer when pricing scrolls into view
 *
 * @example
 * trackPricingView()
 */
export function trackPricingView(): void {
  trackEvent('pricing_view', {
    page_location: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/**
 * Track calculator usage when sliders are adjusted
 * Debounce this to avoid excessive events
 *
 * @param inputType - Which slider was adjusted
 * @param value - The new value
 *
 * @example
 * trackCalculatorUsed('posts_to_analyze', 15)
 */
export function trackCalculatorUsed(
  inputType: 'posts' | 'ai_searches' | 'profiles' | 'monitored_posts' | 'enrichments' | 'emails',
  value: number
): void {
  trackEvent('calculator_used', {
    calculator_input: inputType,
    input_value: value,
  });
}

/**
 * Track CTA clicks from the calculator page (after using calculator)
 * These are high-intent signals
 *
 * @param recommendedPlan - The plan recommended based on their calculation
 * @param totalCost - Calculated monthly cost
 *
 * @example
 * trackCalculatorCTAClick('growth', 179)
 */
export function trackCalculatorCTAClick(
  recommendedPlan: string,
  totalCost: number
): void {
  trackEvent('calculator_cta_click', {
    recommended_plan: recommendedPlan,
    calculated_cost: totalCost,
  });
}

/**
 * Track when user clicks "Contact Sales" for enterprise
 *
 * @example
 * trackContactSalesClick()
 */
export function trackContactSalesClick(): void {
  trackEvent('contact_sales_click', {
    source: 'pricing',
  });
}

// =============================================================================
// TIER 3: NICE TO HAVE EVENTS
// =============================================================================

/**
 * Track "Try Demo" button clicks from hero
 *
 * @example
 * trackTryDemoClick()
 */
export function trackTryDemoClick(): void {
  trackEvent('try_demo_click', {
    source: 'hero',
  });
}

/**
 * Track CTA clicks from blog posts
 *
 * @param blogSlug - The blog post slug/URL
 * @param buttonText - The CTA button text
 *
 * @example
 * trackBlogCTAClick('linkedin-engagement-leads', 'Get Started Free')
 */
export function trackBlogCTAClick(blogSlug: string, buttonText: string): void {
  trackEvent('blog_cta_click', {
    blog_slug: blogSlug,
    button_text: buttonText,
  });
}

/**
 * Track "Find Email" button clicks in the demo
 *
 * @param leadIndex - Which lead card (for debugging)
 *
 * @example
 * trackEmailFound(0)
 */
export function trackEmailFound(leadIndex: number): void {
  trackEvent('email_found', {
    lead_index: leadIndex,
  });
}

/**
 * Track FAQ accordion expansions on the contact page
 * Helps understand what questions users have
 *
 * @param questionIndex - Which FAQ was expanded
 * @param questionText - The question text (truncated)
 *
 * @example
 * trackFAQExpand(0, 'How does Guffles find leads...')
 */
export function trackFAQExpand(questionIndex: number, questionText: string): void {
  trackEvent('faq_expand', {
    faq_index: questionIndex,
    faq_question: questionText.slice(0, 100), // Truncate to avoid overly long params
  });
}
