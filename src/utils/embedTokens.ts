/**
 * Embed Token Utilities
 *
 * Functions for generating and validating embed tokens for chart embeds.
 * Tokens are used to create secure public URLs for embedding charts.
 */

/**
 * Generate a random embed token
 * @returns 32-character alphanumeric token
 */
export function generateEmbedToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Chart type identifiers for embed URLs
 */
export type ChartType = 'main-chart' | 'protein-goal' | 'calorie-limit' | 'protein-streak' | 'calorie-streak';

/**
 * Generate embed URL for a chart type and token
 * @param chartType - Type of chart to embed
 * @param token - Embed token
 * @returns Full embed URL
 */
export function generateEmbedUrl(chartType: ChartType, token: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://food-winy-ai.web.app';
  return `${baseUrl}/embed/${chartType}/${token}`;
}

/**
 * Parse embed URL to extract chart type and token
 * @param url - Embed URL
 * @returns Object with chartType and token, or null if invalid
 */
export function parseEmbedUrl(url: string): { chartType: ChartType; token: string } | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/^\/embed\/([^/]+)\/([^/]+)$/);
    if (match) {
      const chartType = match[1] as ChartType;
      const token = match[2];
      return { chartType, token };
    }
  } catch (e) {
    // Invalid URL
  }
  return null;
}

