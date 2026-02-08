/**
 * Cache TTL strategies for different FPL data types
 * TTL values in seconds
 */
export const CACHE_STRATEGIES = {
  // Rarely changes, cache aggressively
  BOOTSTRAP: {
    ttl: 3600,                    // 1 hour
    staleWhileRevalidate: 600,    // 10 minutes
    cdnMaxAge: 1800,              // 30 minutes on CDN
  },

  // Static during gameweek
  FIXTURES: {
    ttl: 21600,                   // 6 hours
    staleWhileRevalidate: 1800,   // 30 minutes
    cdnMaxAge: 3600,              // 1 hour on CDN
  },

  // Updates frequently during matches
  LIVE_GW_ACTIVE: {
    ttl: 30,                      // 30 seconds
    staleWhileRevalidate: 10,     // 10 seconds
    cdnMaxAge: 15,                // 15 seconds on CDN
  },

  // Never changes after gameweek ends
  LIVE_GW_FINISHED: {
    ttl: 86400 * 365,             // 1 year (effectively permanent)
    staleWhileRevalidate: 0,
    cdnMaxAge: 86400,             // 24 hours on CDN
  },

  // Team data
  TEAM_ENTRY: {
    ttl: 300,                     // 5 minutes
    staleWhileRevalidate: 60,     // 1 minute
    cdnMaxAge: 120,               // 2 minutes on CDN
  },

  // Historical data
  TEAM_HISTORY: {
    ttl: 900,                     // 15 minutes
    staleWhileRevalidate: 300,    // 5 minutes
    cdnMaxAge: 600,               // 10 minutes on CDN
  },

  // Can change before deadline
  TEAM_PICKS_CURRENT: {
    ttl: 60,                      // 1 minute
    staleWhileRevalidate: 30,     // 30 seconds
    cdnMaxAge: 30,                // 30 seconds on CDN
  },

  // Locked after deadline
  TEAM_PICKS_PAST: {
    ttl: 86400,                   // 24 hours
    staleWhileRevalidate: 3600,   // 1 hour
    cdnMaxAge: 3600,              // 1 hour on CDN
  },

  PLAYER_SUMMARY: {
    ttl: 300,                     // 5 minutes
    staleWhileRevalidate: 60,     // 1 minute
    cdnMaxAge: 120,               // 2 minutes on CDN
  },

  TEAM_TRANSFERS: {
    ttl: 300,                     // 5 minutes
    staleWhileRevalidate: 60,     // 1 minute
    cdnMaxAge: 120,               // 2 minutes on CDN
  },
};

/**
 * Session expiry times
 */
export const SESSION_EXPIRY = {
  AUTHENTICATED: 7 * 24 * 60 * 60,  // 7 days in seconds
  GUEST: 24 * 60 * 60,              // 24 hours in seconds
};
