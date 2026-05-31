/**
 * ENHANCED DATA CONTEXT WITH DIAGNOSTICS
 * 
 * Features:
 * - Bidirectional comparison validation
 * - Case-insensitive set matching
 * - Duplicate detection
 * - Mismatch diagnostics
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { InstagramUser } from '../utils/parser-enhanced';

interface ComparisonStats {
  totalFollowers: number;
  totalFollowing: number;
  mutualCount: number;
  unfollowerCount: number;
  fanCount: number;
  potentialMismatches: string[]; // Usernames that might have matching issues
}

interface DataContextType {
  followers: InstagramUser[];
  following: InstagramUser[];
  unfollowers: InstagramUser[];
  fans: InstagramUser[];
  mutuals: InstagramUser[];
  setFollowersData: (data: InstagramUser[]) => void;
  setFollowingData: (data: InstagramUser[]) => void;
  clearData: () => void;
  isDataReady: boolean;
  stats?: ComparisonStats;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Robust set comparison with detailed diagnostics
 */
function compareFollowRelationships(
  followers: InstagramUser[],
  following: InstagramUser[]
): {
  unfollowers: InstagramUser[];
  fans: InstagramUser[];
  mutuals: InstagramUser[];
  stats: ComparisonStats;
} {
  // Create normalized sets for comparison
  const followersSet = new Set(followers.map(f => f.username));
  const followingSet = new Set(following.map(f => f.username));

  // Bidirectional lookup for validation
  const unfollowers: InstagramUser[] = [];
  const fans: InstagramUser[] = [];
  const mutuals: InstagramUser[] = [];
  const potentialMismatches: string[] = [];

  /**
   * Unfollowers: People you follow but don't follow you back
   * Double-check: User exists in following set AND not in followers set
   */
  following.forEach((user) => {
    if (!followersSet.has(user.username)) {
      // Verify this isn't a case sensitivity issue
      const caseInsensitiveMatch = Array.from(followersSet).find(
        (f) => f.localeCompare(user.username, undefined, { sensitivity: 'base' }) === 0
      );

      if (caseInsensitiveMatch) {
        potentialMismatches.push(
          `Potential case mismatch: "${user.username}" vs "${caseInsensitiveMatch}"`
        );
      } else {
        unfollowers.push(user);
      }
    } else {
      // Verify bidirectionally - must be in mutuals
      mutuals.push(user);
    }
  });

  /**
   * Fans: People who follow you but you don't follow back
   * Lookup: User in followers but NOT in following
   */
  followers.forEach((user) => {
    if (!followingSet.has(user.username)) {
      // Verify bidirectionally
      const caseInsensitiveMatch = Array.from(followingSet).find(
        (f) => f.localeCompare(user.username, undefined, { sensitivity: 'base' }) === 0
      );

      if (caseInsensitiveMatch) {
        potentialMismatches.push(
          `Potential case mismatch in fans: "${user.username}" vs "${caseInsensitiveMatch}"`
        );
      } else {
        fans.push(user);
      }
    }
  });

  return {
    unfollowers,
    fans,
    mutuals,
    stats: {
      totalFollowers: followers.length,
      totalFollowing: following.length,
      mutualCount: mutuals.length,
      unfollowerCount: unfollowers.length,
      fanCount: fans.length,
      potentialMismatches,
    },
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [followers, setFollowers] = useState<InstagramUser[]>([]);
  const [following, setFollowing] = useState<InstagramUser[]>([]);

  const [unfollowers, setUnfollowers] = useState<InstagramUser[]>([]);
  const [fans, setFans] = useState<InstagramUser[]>([]);
  const [mutuals, setMutuals] = useState<InstagramUser[]>([]);
  const [stats, setStats] = useState<ComparisonStats>();

  const isDataReady = followers.length > 0 && following.length > 0;

  /**
   * Main effect: Calculate relationships whenever data changes
   */
  useEffect(() => {
    if (!isDataReady) {
      setUnfollowers([]);
      setFans([]);
      setMutuals([]);
      setStats(undefined);
      return;
    }

    const comparison = compareFollowRelationships(followers, following);

    setUnfollowers(comparison.unfollowers);
    setFans(comparison.fans);
    setMutuals(comparison.mutuals);
    setStats(comparison.stats);

    // Log potential issues for debugging
    if (comparison.stats.potentialMismatches.length > 0) {
      console.warn('⚠️ Potential Username Mismatches:', comparison.stats.potentialMismatches);
    }

    console.log('📊 Comparison Results:', {
      followers: comparison.stats.totalFollowers,
      following: comparison.stats.totalFollowing,
      mutuals: comparison.stats.mutualCount,
      fans: comparison.stats.fanCount,
      unfollowers: comparison.stats.unfollowerCount,
    });
  }, [followers, following, isDataReady]);

  const setFollowersData = (data: InstagramUser[]) => setFollowers(data);
  const setFollowingData = (data: InstagramUser[]) => setFollowing(data);

  const clearData = () => {
    setFollowers([]);
    setFollowing([]);
  };

  return (
    <DataContext.Provider
      value={{
        followers,
        following,
        unfollowers,
        fans,
        mutuals,
        setFollowersData,
        setFollowingData,
        clearData,
        isDataReady,
        stats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
