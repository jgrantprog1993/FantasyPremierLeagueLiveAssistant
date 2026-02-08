/**
 * FPL API Base URL
 */
export const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

/**
 * FPL Static Assets Base URL
 */
export const FPL_STATIC_URL = 'https://fantasy.premierleague.com/dist/img';

/**
 * FPL Login URL
 */
export const FPL_LOGIN_URL = 'https://users.premierleague.com/accounts/login/';

/**
 * Get team shirt image URL
 * @param {number} teamCode - The team's code (not ID)
 * @param {boolean} isGoalkeeper - Whether to get goalkeeper shirt
 * @returns {string} - URL to the shirt image
 */
export function getShirtUrl(teamCode, isGoalkeeper = false) {
  const suffix = isGoalkeeper ? '_1' : '';
  return `${FPL_STATIC_URL}/shirts/standard/shirt_${teamCode}${suffix}-110.webp`;
}

/**
 * Get player photo URL
 * @param {string} photoCode - Player's photo code (e.g., "123456")
 * @returns {string} - URL to the player photo
 */
export function getPlayerPhotoUrl(photoCode) {
  // Photo code usually ends in .jpg, we replace with .png for the API
  const code = photoCode?.replace('.jpg', '');
  return `${FPL_STATIC_URL}/players/${code}.png`;
}

/**
 * FPL API Endpoints
 */
export const FPL_ENDPOINTS = {
  // Public endpoints (no auth required)
  BOOTSTRAP: '/bootstrap-static/',
  FIXTURES: '/fixtures/',
  FIXTURES_BY_GW: (gw) => `/fixtures/?event=${gw}`,
  LIVE_GW: (gw) => `/event/${gw}/live/`,
  ENTRY: (teamId) => `/entry/${teamId}/`,
  ENTRY_HISTORY: (teamId) => `/entry/${teamId}/history/`,
  ENTRY_TRANSFERS: (teamId) => `/entry/${teamId}/transfers/`,
  ENTRY_PICKS: (teamId, gw) => `/entry/${teamId}/event/${gw}/picks/`,
  ELEMENT_SUMMARY: (playerId) => `/element-summary/${playerId}/`,
  REGIONS: '/regions/',

  // Private endpoints (auth required)
  MY_TEAM: (teamId) => `/my-team/${teamId}/`,
  TRANSFERS_LATEST: (teamId) => `/entry/${teamId}/transfers-latest/`,
  ME: '/me/',
};
