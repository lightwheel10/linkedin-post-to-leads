// ============================================================================
// ONBOARDING OPTIONS - Predefined selections for onboarding flow
// ============================================================================

export const LOCATION_OPTIONS = [
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'africa', label: 'Africa' },
  { value: 'global', label: 'Global / Remote' },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'fintech', label: 'FinTech / Finance' },
  { value: 'healthtech', label: 'HealthTech / Healthcare' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'agency', label: 'Agency / Consulting' },
  { value: 'ai-ml', label: 'AI / Machine Learning' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'edtech', label: 'EdTech / Education' },
  { value: 'real-estate', label: 'Real Estate / PropTech' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'logistics', label: 'Logistics / Supply Chain' },
  { value: 'other', label: 'Other' },
] as const;

// Default ICP keywords for new users (can be customized during onboarding)
export const DEFAULT_ICP_KEYWORDS = [
  'ceo', 'cto', 'founder', 'director', 'vp', 'vice president',
  'head of', 'chief', 'manager', 'lead', 'senior', 'principal'
];

// Default exclude keywords for new users
export const DEFAULT_EXCLUDE_KEYWORDS = [
  'student', 'intern', 'looking for', 'seeking'
];

// Type exports for use in components
export type LocationOption = typeof LOCATION_OPTIONS[number];
export type IndustryOption = typeof INDUSTRY_OPTIONS[number];
export type LocationValue = LocationOption['value'];
export type IndustryValue = IndustryOption['value'];

