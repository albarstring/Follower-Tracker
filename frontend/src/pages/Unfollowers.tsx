import React from 'react';
import { UserList } from '../components/ui/UserList';
import { useData } from '../context/DataContext';

export default function Unfollowers() {
  const { unfollowers, isDataReady } = useData();

  return (
    <UserList 
      title="Unfollowers" 
      description="People you follow but they don't follow you back." 
      emptyMessage="Upload your data to see who unfollowed you." 
      users={unfollowers}
      isDataReady={isDataReady}
    />
  );
}


