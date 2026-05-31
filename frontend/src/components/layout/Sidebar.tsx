import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserMinus, Activity, UploadCloud, Settings } from 'lucide-react';

export function Sidebar() {
  const routes = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Data', path: '/dashboard/upload', icon: UploadCloud },
    { name: 'Unfollowers', path: '/dashboard/unfollowers', icon: UserMinus },
    { name: 'Fans', path: '/dashboard/fans', icon: Users },
    { name: 'Mutuals', path: '/dashboard/mutuals', icon: Users },
    { name: 'Analytics', path: '/dashboard/analytics', icon: Activity },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 h-screen bg-white dark:bg-gray-950 flex flex-col sticky top-0 hidden md:flex">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tighter gradient-text flex items-center gap-2">
          FollowTrack
        </h2>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            end={route.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-gray-900 dark:text-brand-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            <route.icon className="w-5 h-5" />
            {route.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900 transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </aside>
  );
}
