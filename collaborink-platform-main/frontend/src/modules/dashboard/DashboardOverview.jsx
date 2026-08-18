import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useProjectStore } from '../../store/projectStore';
import {
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function DashboardOverview({ workspace }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [workspace]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch workspace stats
      const statsResponse = await api.get(`/workspaces/${workspace._id}/stats`);
      setStats(statsResponse.data);

      // Fetch recent activity
      const activityResponse = await api.get(
        `/workspaces/${workspace._id}/activity`
      );
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Mon', tasks: 40, completed: 24 },
    { name: 'Tue', tasks: 30, completed: 13 },
    { name: 'Wed', tasks: 20, completed: 20 },
    { name: 'Thu', tasks: 27, completed: 20 },
    { name: 'Fri', tasks: 35, completed: 30 },
    { name: 'Sat', tasks: 20, completed: 18 },
    { name: 'Sun', tasks: 12, completed: 12 },
  ];

  const taskStatusData = [
    { name: 'Todo', value: 45 },
    { name: 'In Progress', value: 30 },
    { name: 'Review', value: 15 },
    { name: 'Done', value: 60 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back to {workspace.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Tasks</h3>
            <AlertCircle className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {stats?.totalTasks || 0}
          </p>
          <p className="text-sm text-green-400">↑ 12% from last week</p>
        </div>

        {/* Completed Tasks Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Completed</h3>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {stats?.completedTasks || 0}
          </p>
          <p className="text-sm text-green-400">↑ 8% from last week</p>
        </div>

        {/* Team Members Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Team Members</h3>
            <Users className="text-purple-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {workspace.members?.length || 0}
          </p>
          <p className="text-sm text-green-400">All active</p>
        </div>

        {/* Productivity Score Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Productivity</h3>
            <TrendingUp className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">85%</p>
          <p className="text-sm text-green-400">↑ 5% from last week</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Over Time Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Tasks Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#3B82F6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10B981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Task Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-850 transition"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}