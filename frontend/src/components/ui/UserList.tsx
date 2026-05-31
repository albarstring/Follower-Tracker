import React, { useState } from 'react';
import type { InstagramUser } from '../../utils/parser';
import { ExternalLink, Search } from 'lucide-react';

interface UserListProps {
  title: string;
  description: string;
  emptyMessage: string;
  users: InstagramUser[];
  isDataReady: boolean;
}

export function UserList({ title, description, emptyMessage, users, isDataReady }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'alpha-asc' | 'alpha-desc'>('alpha-asc');

  // Filter & Sort Logic
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'alpha-asc') return a.username.localeCompare(b.username);
    if (sortBy === 'alpha-desc') return b.username.localeCompare(a.username);
    return 0;
  });

  if (!isDataReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">?</span>
          </div>
          <h3 className="text-lg font-medium mb-1">No data available</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title} <span className="text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full text-base ml-2">{users.length}</span></h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search username..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
          />
        </div>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none text-sm"
        >
          <option value="alpha-asc">A to Z</option>
          <option value="alpha-desc">Z to A</option>
        </select>
      </div>

      {/* Grid List */}
      {filteredUsers.length === 0 ? (
         <div className="py-12 text-center text-gray-500">
           No users found matching "{searchTerm}"
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.username} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center text-center transition-shadow hover:shadow-md">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate w-full" title={user.username}>
                @{user.username}
              </h3>
              <a 
                href={`https://instagram.com/${user.username}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
              >
                View Profile <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
