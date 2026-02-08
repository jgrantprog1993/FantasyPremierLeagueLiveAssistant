import { FPL_BASE_URL } from './endpoints';

/**
 * Custom error class for FPL API errors
 */
export class FPLError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'FPLError';
    this.status = status;
  }
}

/**
 * Fetch data from the FPL API
 * @param {string} endpoint - The API endpoint path
 * @param {Object} options - Request options
 * @param {Object} options.cookies - Auth cookies for private endpoints
 * @param {number} options.revalidate - Cache revalidation time in seconds
 * @returns {Promise<Object>} - The JSON response
 */
export async function fplFetch(endpoint, options = {}) {
  const headers = {
    'User-Agent': 'FPL-Dashboard/1.0',
  };

  // Add auth cookies for private endpoints
  if (options.cookies) {
    headers['Cookie'] = `pl_profile=${options.cookies.pl_profile}; sessionid=${options.cookies.sessionid}`;
  }

  const fetchOptions = {
    headers,
  };

  // Add Next.js cache revalidation if specified
  if (options.revalidate !== undefined) {
    fetchOptions.next = { revalidate: options.revalidate };
  }

  const response = await fetch(`${FPL_BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new FPLError(response.status, text || `FPL API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if an error is an FPL API error
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
export function isFPLError(error) {
  return error instanceof FPLError;
}
