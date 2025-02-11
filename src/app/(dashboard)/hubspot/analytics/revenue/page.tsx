import { useState, useEffect } from 'react';
import { DollarSign, Filter, Download, Calendar, TrendingUp, Target, BarChart3, PieChart } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface RevenueOverTime {
  date: string;
  newRevenue: number;
  closedRevenue: number;
  deals: number;
  wonDeals: number;
}

interface RevenueBySource {
  [key: string]: {
    totalRevenue: number;
    deals: number;
    avgDealSize: number;
  };
}

interface DealsByStage {
  [key: string]: {
    count: number;
    value: number;
  };
}

interface RevenueAnalytics {
  summary: {
    totalRevenue: number;
    wonRevenue: number;
    averageDealSize: number;
    forecastedRevenue: number;
    totalDeals: number;
    wonDeals: number;
    pipelineValue: number;
  };
  dealsByStage: DealsByStage;
  revenueOverTime: RevenueOverTime[];
  revenueBySource: RevenueBySource;
}

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevenueAnalytics | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/hubspot/analytics/revenue?dateRange=${dateRange}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching revenue analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const handleExport = () => {
    if (!data) return;

    // Convert data to CSV
    const headers = [
      ['Revenue Analytics Summary'],
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(data.summary.totalRevenue)],
      ['Won Revenue', formatCurrency(data.summary.wonRevenue)],
      ['Average Deal Size', formatCurrency(data.summary.averageDealSize)],
      ['Forecasted Revenue', formatCurrency(data.summary.forecastedRevenue)],
      ['Total Deals', data.summary.totalDeals],
      ['Won Deals', data.summary.wonDeals],
      ['Pipeline Value', formatCurrency(data.summary.pipelineValue)],
      [],
      ['Revenue by Stage'],
      ['Stage', 'Deal Count', 'Value'],
      ...Object.entries(data.dealsByStage).map(([stage, metrics]) => [
        stage,
        metrics.count,
        formatCurrency(metrics.value)
      ]),
      [],
      ['Revenue by Source'],
      ['Source', 'Total Revenue', 'Deals', 'Average Deal Size'],
      ...Object.entries(data.revenueBySource).map(([source, metrics]) => [
        source,
        formatCurrency(metrics.totalRevenue),
        metrics.deals,
        formatCurrency(metrics.avgDealSize)
      ]),
      [],
      ['Revenue Over Time'],
      ['Date', 'New Revenue', 'Closed Revenue', 'Deals', 'Won Deals'],
      ...data.revenueOverTime.map(day => [
        new Date(day.date).toLocaleDateString(),
        formatCurrency(day.newRevenue),
        formatCurrency(day.closedRevenue),
        day.deals,
        day.wonDeals
      ])
    ];

    const csvContent = headers.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <DollarSign className="w-6 h-6 text-blue-600" />
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
          No revenue analytics available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Revenue Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track revenue trends, forecasts, and deal values
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Won Revenue</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.wonRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pipeline Value</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.pipelineValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Forecasted Revenue</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.forecastedRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Stage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Stage</h2>
        <div className="space-y-4">
          {Object.entries(data.dealsByStage).map(([stage, metrics]) => (
            <div key={stage} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stage}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({metrics.count} deals)
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(metrics.value)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(metrics.value / data.summary.totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Source */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Source</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deals</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Deal Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {Object.entries(data.revenueBySource).map(([source, metrics]) => (
                <tr key={source} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(metrics.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatNumber(metrics.deals)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(metrics.avgDealSize)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Over Time</h2>
        <div className="space-y-4">
          {data.revenueOverTime.map((day) => (
            <div key={day.date} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(day.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Revenue</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(day.newRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Closed Revenue</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(day.closedRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deals</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(day.deals)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Won Deals</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(day.wonDeals)}
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