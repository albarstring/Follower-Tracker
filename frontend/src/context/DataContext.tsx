import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { InstagramUser } from '../utils/parser';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// LocalStorage keys untuk persist data
const STORAGE_KEYS = {
  followers: 'followtrack_followers',
  following: 'followtrack_following',
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [followers, setFollowers] = useState<InstagramUser[]>([]);
  const [following, setFollowing] = useState<InstagramUser[]>([]);
  
  const [unfollowers, setUnfollowers] = useState<InstagramUser[]>([]);
  const [fans, setFans] = useState<InstagramUser[]>([]);
  const [mutuals, setMutuals] = useState<InstagramUser[]>([]);

  const isDataReady = followers.length > 0 && following.length > 0;

  // Load data dari localStorage saat app pertama kali mount
  useEffect(() => {
    try {
      const savedFollowers = localStorage.getItem(STORAGE_KEYS.followers);
      const savedFollowing = localStorage.getItem(STORAGE_KEYS.following);

      if (savedFollowers) {
        setFollowers(JSON.parse(savedFollowers));
      }
      if (savedFollowing) {
        setFollowing(JSON.parse(savedFollowing));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Hitung relationship setiap kali followers atau following berubah
  useEffect(() => {
    if (!isDataReady) {
      setUnfollowers([]);
      setFans([]);
      setMutuals([]);
      return;
    }

    const followersSet = new Set(followers.map(f => f.username));
    const followingSet = new Set(following.map(f => f.username));

    // Unfollowers: Orang yang kamu ikuti, TAPI tidak ikut kamu balik
    const newUnfollowers = following.filter(u => !followersSet.has(u.username));
    
    // Fans: Orang yang mengikutimu, TAPI tidak kamu ikuti balik
    const newFans = followers.filter(u => !followingSet.has(u.username));
    
    // Mutuals: Saling follow
    const newMutuals = followers.filter(u => followingSet.has(u.username));

    setUnfollowers(newUnfollowers);
    setFans(newFans);
    setMutuals(newMutuals);
  }, [followers, following, isDataReady]);

  // Auto-save followers ke localStorage
  useEffect(() => {
    if (followers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.followers, JSON.stringify(followers));
    }
  }, [followers]);

  // Auto-save following ke localStorage
  useEffect(() => {
    if (following.length > 0) {
      localStorage.setItem(STORAGE_KEYS.following, JSON.stringify(following));
    }
  }, [following]);

  const setFollowersData = (data: InstagramUser[]) => setFollowers(data);
  const setFollowingData = (data: InstagramUser[]) => setFollowing(data);
  
  const clearData = () => {
    setFollowers([]);
    setFollowing([]);
    localStorage.removeItem(STORAGE_KEYS.followers);
    localStorage.removeItem(STORAGE_KEYS.following);
  };

  return (
    <DataContext.Provider value={{
      followers,
      following,
      unfollowers,
      fans,
      mutuals,
      setFollowersData,
      setFollowingData,
      clearData,
      isDataReady
    }}>
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
