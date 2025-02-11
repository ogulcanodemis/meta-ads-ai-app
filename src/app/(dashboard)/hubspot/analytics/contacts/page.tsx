"use client";

import { useState, useEffect } from 'react';
import { Users, Filter, Download, Calendar, TrendingUp, Activity } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface ContactSource {
  source: string;
  count: number;
  percentage: number;
  conversionRate: number;
  engagementScore: number;
}

interface ContactGrowth {
  date: string;
  newContacts: number;
  totalContacts: number;
}

interface ContactAnalytics {
  sources: ContactSource[];
  growth: ContactGrowth[];
  totalContacts: number;
  activeContacts: number;
  averageEngagement: number;
  conversionRate: number;
}

export default function ContactSourceAnalysis() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ContactAnalytics | null>(null);

  const convertToCSV = (data: ContactAnalytics) => {
    // Headers
    const headers = [
      ['Contact Sources'],
      ['Source', 'Count', 'Percentage', 'Conversion Rate', 'Engagement Score'],
      ...data.sources.map(source => [
        source.source,
        source.count.toString(),
        `${source.percentage.toFixed(1)}%`,
        `${source.conversionRate.toFixed(1)}%`,
        source.engagementScore.toFixed(1)
      ]),
      [],
      ['Contact Growth'],
      ['Date', 'New Contacts', 'Total Contacts'],
      ...data.growth.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.newContacts.toString(),
        item.totalContacts.toString()
      ]),
      [],
      ['Quick Stats'],
      ['Metric', 'Value'],
      ['Total Contacts', data.totalContacts.toString()],
      ['Active Contacts', data.activeContacts.toString()],
      ['Average Engagement', data.averageEngagement.toFixed(1)],
      ['Conversion Rate', `${data.conversionRate.toFixed(1)}%`]
    ];

    return headers.map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExport = () => {
    if (!data) return;
    
    const csvContent = convertToCSV(data);
    const fileName = `contact-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, fileName);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/hubspot/analytics/contacts?dateRange=${dateRange}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching contact analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contact analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
          No contact analytics available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contact Source Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze lead sources, engagement metrics, and contact growth
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {data.totalContacts.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Contacts</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {data.activeContacts.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Engagement</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {data.averageEngagement.toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {data.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Sources */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Contact Sources</h2>
        <div className="space-y-4">
          {data.sources.map((source) => (
            <div key={source.source} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{source.source}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({source.count.toLocaleString()} contacts)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {source.conversionRate.toFixed(1)}% conversion
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {source.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Growth */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Contact Growth</h2>
        <div className="space-y-4">
          {data.growth.map((item) => (
            <div key={item.date} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Contacts</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    +{item.newContacts.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {item.totalContacts.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 