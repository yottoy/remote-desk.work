import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { connectToDatabase } from '../../utils/mongodb';
import Head from 'next/head';

interface AnalyticsData {
  _id: string;
  event: string;
  timestamp: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  searchQuery?: string;
  [key: string]: any;
}

interface EventType {
  _id: string;
  count: number;
}

interface AnalyticsSummary {
  totalEvents: number;
  eventCounts: Record<string, number>;
  topViewedJobs: Array<{jobTitle: string; company: string; views: number}>;
  topSearches: Array<{query: string; count: number}>;
  dailyEvents: Array<{date: string; count: number}>;
}

interface AdminAnalyticsProps {
  initialSummary: AnalyticsSummary;
  isAuthorized: boolean;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ initialSummary, isAuthorized }) => {
  const [summary, setSummary] = useState<AnalyticsSummary>(initialSummary);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);

  // Password protection for simple security
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(isAuthorized);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`, {
        headers: {
          'x-admin-auth': localStorage.getItem('admin-token') || ''
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchData();
    }
  }, [timeframe, authorized]);

  const handleAuth = () => {
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('admin-token', data.token);
          setAuthorized(true);
        }
      });
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Head>
          <title>Analytics Dashboard | Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleAuth}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Analytics Dashboard | ClickClickJob.com</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <div className="flex space-x-2">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-lg text-gray-500">Loading analytics data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Total Events Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{summary.totalEvents}</div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Types Breakdown */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Event Types</h3>
                <div className="mt-5">
                  <ul className="space-y-3">
                    {Object.entries(summary.eventCounts).map(([event, count]) => (
                      <li key={event} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600">{event}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                          <span className="ml-2 text-sm font-medium text-gray-500">
                            ({((count / summary.totalEvents) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Top Viewed Jobs */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Top Viewed Jobs</h3>
                <div className="mt-5">
                  <ul className="divide-y divide-gray-200">
                    {summary.topViewedJobs.map((job, index) => (
                      <li key={index} className="py-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{job.jobTitle}</p>
                            <p className="text-sm text-gray-500">{job.company}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{job.views} views</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Top Searches */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Top Searches</h3>
                <div className="mt-5">
                  <ul className="divide-y divide-gray-200">
                    {summary.topSearches.map((search, index) => (
                      <li key={index} className="py-4">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">"{search.query}"</p>
                          <p className="text-sm font-medium text-gray-900">{search.count} searches</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Daily Events Chart */}
            <div className="bg-white overflow-hidden shadow rounded-lg col-span-1 lg:col-span-2">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Daily Events</h3>
                <div className="mt-5 h-64">
                  {/* This would be a chart in a real implementation */}
                  <div className="h-full flex items-end space-x-2">
                    {summary.dailyEvents.map((day, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="bg-blue-500 w-full rounded-t-md" 
                          style={{ 
                            height: `${(day.count / Math.max(...summary.dailyEvents.map(d => d.count))) * 100}%`,
                            minHeight: '4px'
                          }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{day.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check authorization
  const token = context.req.cookies['admin-token'];
  const isAuthorized = token === process.env.ADMIN_SECRET_TOKEN;

  // If not authorized, return empty data
  if (!isAuthorized) {
    return {
      props: {
        initialSummary: {
          totalEvents: 0,
          eventCounts: {},
          topViewedJobs: [],
          topSearches: [],
          dailyEvents: []
        },
        isAuthorized: false
      }
    };
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get basic summary for initial load
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Count total events in the last 7 days
    const totalEvents = await db.collection('analytics_events').countDocuments({
      timestamp: { $gte: weekAgo.toISOString() }
    });
    
    // Get event type breakdown
    const eventTypes = await db.collection('analytics_events').aggregate([
      { $match: { timestamp: { $gte: weekAgo.toISOString() } } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]).toArray() as EventType[];
    
    const eventCounts = eventTypes.reduce((acc: Record<string, number>, curr: EventType) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Get top viewed jobs
    const topViewedJobs = await db.collection('analytics_events').aggregate([
      { $match: { 
        event: 'job_view',
        timestamp: { $gte: weekAgo.toISOString() },
        jobTitle: { $exists: true }
      }},
      { $group: { 
        _id: { jobId: '$jobId', jobTitle: '$jobTitle', company: '$company' },
        views: { $sum: 1 }
      }},
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $project: {
        _id: 0,
        jobId: '$_id.jobId',
        jobTitle: '$_id.jobTitle',
        company: '$_id.company',
        views: 1
      }}
    ]).toArray();
    
    // Get top searches
    const topSearches = await db.collection('analytics_events').aggregate([
      { $match: { 
        event: 'search',
        timestamp: { $gte: weekAgo.toISOString() },
        searchQuery: { $exists: true, $ne: '' }
      }},
      { $group: { 
        _id: '$searchQuery',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: {
        _id: 0,
        query: '$_id',
        count: 1
      }}
    ]).toArray();
    
    // Get daily events for the last 7 days
    const dailyEvents = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const count = await db.collection('analytics_events').countDocuments({
        timestamp: { 
          $gte: date.toISOString(),
          $lt: nextDate.toISOString()
        }
      });
      
      dailyEvents.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    return {
      props: {
        initialSummary: {
          totalEvents,
          eventCounts,
          topViewedJobs,
          topSearches,
          dailyEvents
        },
        isAuthorized: true
      }
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      props: {
        initialSummary: {
          totalEvents: 0,
          eventCounts: {},
          topViewedJobs: [],
          topSearches: [],
          dailyEvents: []
        },
        isAuthorized: false
      }
    };
  }
};

export default AdminAnalytics; 