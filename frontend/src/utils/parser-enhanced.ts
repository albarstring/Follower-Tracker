/**
 * ENHANCED INSTAGRAM DATA PARSER - Production Grade
 * 
 * Issues Fixed:
 * 1. Username normalization (case, whitespace, special chars)
 * 2. Handle both followers_1.json and following.json schemas
 * 3. Comprehensive null/undefined checks
 * 4. URL extraction validation
 * 5. Duplicate removal with conflict resolution
 * 6. Detailed error logging for debugging
 */

export interface InstagramUser {
  username: string;
  timestamp?: number;
  source?: 'followers' | 'following';
  rawUsername?: string; // Store original for debugging
}

export interface ParseResult {
  users: InstagramUser[];
  stats: {
    total: number;
    duplicates: number;
    nullsSkipped: number;
    errors: string[];
  };
}

/**
 * Normalize username for consistent comparison
 * - Remove leading/trailing whitespace
 * - Convert to lowercase
 * - Remove special Unicode characters
 * - Validate against Instagram username rules
 */
function normalizeUsername(raw: any): string | null {
  if (!raw) return null;

  let username = String(raw)
    .trim()
    .toLowerCase()
    .replace(/\u200B/g, ''); // Remove zero-width spaces

  // Validate Instagram username pattern: 1-30 chars, alphanumeric, dots, underscores
  if (!/^[a-z0-9._]{1,30}$/.test(username)) {
    return null;
  }

  return username;
}

/**
 * Extract username from Instagram profile URL
 * Handles:
 * - https://www.instagram.com/username
 * - https://www.instagram.com/_u/username
 * - instagram.com/_u/username
 */
function extractUsernameFromUrl(href: string): string | null {
  if (!href || typeof href !== 'string') return null;

  try {
    // Remove protocol and split by /
    const parts = href.replace(/^https?:\/\/(www\.)?/, '').split('/');
    
    // Filter out empty parts
    const filtered = parts.filter(p => p && p !== '_u');
    
    // Get the last meaningful part
    const candidate = filtered[filtered.length - 1];
    
    return normalizeUsername(candidate);
  } catch (e) {
    return null;
  }
}

/**
 * Parse a single followers_1.json formatted object
 * Structure: Array of {title, string_list_data: [{href, value, timestamp}]}
 */
function parseFollowersFormat(data: any, stats: any): InstagramUser[] {
  const users: InstagramUser[] = [];

  if (!Array.isArray(data)) {
    stats.errors.push('Expected array for followers format');
    return users;
  }

  data.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') {
      stats.nullsSkipped++;
      return;
    }

    const listData = entry.string_list_data;
    if (!Array.isArray(listData)) {
      stats.nullsSkipped++;
      return;
    }

    listData.forEach((item) => {
      if (!item || typeof item !== 'object') {
        stats.nullsSkipped++;
        return;
      }

      // Primary source: item.value
      let username = normalizeUsername(item.value);

      // Fallback: extract from href
      if (!username && item.href) {
        username = extractUsernameFromUrl(item.href);
      }

      if (username) {
        users.push({
          username,
          timestamp: item.timestamp ?? undefined,
          source: 'followers',
          rawUsername: item.value || item.href,
        });
      } else {
        stats.nullsSkipped++;
      }
    });
  });

  return users;
}

/**
 * Parse a single following.json formatted object
 * Structure: {relationships_following: [{title, string_list_data: [{href, timestamp}]}]}
 */
function parseFollowingFormat(data: any, stats: any): InstagramUser[] {
  const users: InstagramUser[] = [];

  if (!data || typeof data !== 'object') {
    stats.errors.push('Expected object for following format');
    return users;
  }

  const followingList = data.relationships_following;
  if (!Array.isArray(followingList)) {
    stats.errors.push('Expected relationships_following array');
    return users;
  }

  followingList.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      stats.nullsSkipped++;
      return;
    }

    // Primary source in following.json: entry.title
    let username = normalizeUsername(entry.title);

    // Secondary source: extract from string_list_data items
    if (!username && Array.isArray(entry.string_list_data)) {
      const item = entry.string_list_data[0];
      if (item && item.href) {
        username = extractUsernameFromUrl(item.href);
      }
    }

    if (username) {
      users.push({
        username,
        timestamp: entry.string_list_data?.[0]?.timestamp ?? undefined,
        source: 'following',
        rawUsername: entry.title,
      });
    } else {
      stats.nullsSkipped++;
    }
  });

  return users;
}

/**
 * Auto-detect format based on structure
 * Returns 'followers' | 'following' | null
 */
function detectFormat(data: any): 'followers' | 'following' | null {
  if (!data) return null;

  // Check for following.json format
  if (data.relationships_following) {
    return 'following';
  }

  // Check for followers.json format (Array of objects with string_list_data)
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (first && first.string_list_data) {
      return 'followers';
    }
  }

  return null;
}

/**
 * Main parser function
 */
export function parseInstagramDataEnhanced(jsonData: any): ParseResult {
  const stats = {
    total: 0,
    duplicates: 0,
    nullsSkipped: 0,
    errors: [] as string[],
  };

  try {
    if (!jsonData) {
      stats.errors.push('No data provided');
      return { users: [], stats };
    }

    const format = detectFormat(jsonData);

    let rawUsers: InstagramUser[] = [];

    if (format === 'followers') {
      rawUsers = parseFollowersFormat(jsonData, stats);
    } else if (format === 'following') {
      rawUsers = parseFollowingFormat(jsonData, stats);
    } else {
      stats.errors.push('Unrecognized JSON format');
      return { users: [], stats };
    }

    // Remove duplicates using Map (last entry wins on collision)
    const userMap = new Map<string, InstagramUser>();
    rawUsers.forEach((user) => {
      userMap.set(user.username, user);
    });

    stats.duplicates = rawUsers.length - userMap.size;
    stats.total = userMap.size;

    return {
      users: Array.from(userMap.values()),
      stats,
    };
  } catch (error) {
    stats.errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    return { users: [], stats };
  }
}

/**
 * LEGACY WRAPPER - Keep old function signature for compatibility
 */
export function parseInstagramData(jsonData: any): InstagramUser[] {
  const result = parseInstagramDataEnhanced(jsonData);
  
  if (result.stats.errors.length > 0) {
    console.warn('Parser warnings:', result.stats);
  }

  return result.users;
}
