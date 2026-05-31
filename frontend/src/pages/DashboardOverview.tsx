import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, UserMinus, UserCheck, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function DashboardOverview() {
  const { followers, following, unfollowers, mutuals, fans, isDataReady } = useData();

  if (!isDataReady) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
        <p className="text-gray-500 mb-6">Please upload your Instagram data first to see your dashboard.</p>
      </div>
    );
  }

  const stats = [
    { name: 'Total Followers', value: followers.length.toLocaleString(), change: '', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { name: 'Unfollowers', value: unfollowers.length.toLocaleString(), change: '', icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    { name: 'Mutual Followers', value: mutuals.length.toLocaleString(), change: '', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { name: 'Fans', value: fans.length.toLocaleString(), change: '', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  // Build monthly cumulative series from optional timestamps on user entries
  const buildMonthlySeries = (items: any[]) => {
    const dates = items
      .map(i => i.timestamp)
      .filter(Boolean)
      .map((ts: number) => new Date(ts * 1000));

    if (dates.length === 0) return [];

    const counts: Record<string, number> = {};
    dates.forEach(d => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    const keys = Object.keys(counts).sort();
    const series: { period: string; count: number; cumulative: number }[] = [];
    let cum = 0;
    keys.forEach(k => {
      cum += counts[k];
      series.push({ period: k, count: counts[k], cumulative: cum });
    });

    return series;
  };

  const followersSeries = buildMonthlySeries(followers);
  const followingSeries = buildMonthlySeries(following);
  const allPeriods = Array.from(new Set([...(followersSeries.map(s => s.period)), ...(followingSeries.map(s => s.period))])).sort();
  const growthData = allPeriods.map(p => ({
    period: p,
    followers: (followersSeries.find(s => s.period === p)?.cumulative) || 0,
    following: (followingSeries.find(s => s.period === p)?.cumulative) || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your Instagram account today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
          <CardHeader>
            <CardTitle>Growth Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {growthData.length === 0 ? (
              <div className="h-72 flex items-center justify-center border-t border-gray-100 dark:border-gray-800/50 pt-6">
                <span className="text-gray-400">Time-based data not available in export</span>
              </div>
            ) : (
              <div className="h-72 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="following" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
          <CardHeader>
            <CardTitle>Account Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
               <span className="text-sm font-medium">Following</span>
               <span className="font-bold">{following.length.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
               <span className="text-sm font-medium">Follow Ratio</span>
               <span className="font-bold">{following.length > 0 ? (followers.length / following.length).toFixed(2) : 0}x</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
