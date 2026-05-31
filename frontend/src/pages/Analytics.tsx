import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { TrendingUp, Users, UserMinus, UserCheck } from 'lucide-react';

export default function Analytics() {
  const { followers, following, unfollowers, fans, mutuals, isDataReady } = useData();

  if (!isDataReady) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
        <p className="text-gray-500 mb-6">Please upload your Instagram data first to see analytics.</p>
      </div>
    );
  }

  // Prepare data for charts
  const audienceData = [
    { name: 'Followers', value: followers.length, color: '#3b82f6' },
    { name: 'Following', value: following.length, color: '#8b5cf6' },
  ];

  const relationshipData = [
    { name: 'Mutual Followers', value: mutuals.length, color: '#10b981' },
    { name: 'Fans', value: fans.length, color: '#f59e0b' },
    { name: 'Unfollowers', value: unfollowers.length, color: '#ef4444' },
  ];

  const chartData = [
    { category: 'Mutuals', count: mutuals.length },
    { category: 'Fans', count: fans.length },
    { category: 'Unfollowers', count: unfollowers.length },
  ];

  // Calculate metrics
  const followRatio = following.length > 0 ? (followers.length / following.length).toFixed(2) : 0;
  const followbackPercentage = following.length > 0 ? ((mutuals.length / following.length) * 100).toFixed(1) : 0;
  const engagementRate = followers.length > 0 ? ((mutuals.length / followers.length) * 100).toFixed(1) : 0;
  const unfollowerPercentage = following.length > 0 ? ((unfollowers.length / following.length) * 100).toFixed(1) : 0;

  const metrics = [
    { label: 'Follow Ratio', value: followRatio, description: 'Followers / Following', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Followback %', value: `${followbackPercentage}%`, description: 'Of accounts you follow', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Engagement Rate', value: `${engagementRate}%`, description: 'Mutuals from followers', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Unfollower %', value: `${unfollowerPercentage}%`, description: 'Of accounts you follow', icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed insights and charts about your audience.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</p>
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Followers vs Following Pie Chart */}
        <Card className="border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
          <CardHeader>
            <CardTitle>Followers vs Following</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={audienceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {audienceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Relationship Distribution Pie Chart */}
        <Card className="border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
          <CardHeader>
            <CardTitle>Relationship Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={relationshipData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {relationshipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Relationship Categories */}
        <Card className="md:col-span-2 border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
          <CardHeader>
            <CardTitle>Audience Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="border-none shadow-sm shadow-gray-200/50 dark:shadow-none">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Followers</p>
              <p className="text-3xl font-bold">{followers.length.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Following</p>
              <p className="text-3xl font-bold">{following.length.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Difference</p>
              <p className={`text-3xl font-bold ${followers.length >= following.length ? 'text-green-600' : 'text-red-600'}`}>
                {(followers.length - following.length).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
