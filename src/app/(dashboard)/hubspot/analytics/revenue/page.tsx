"use client";

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface RevenueMetrics {
  totalRevenue: number;
  wonRevenue: number;
  averageDealSize: number;
  forecastedRevenue: number;
  totalDeals: number;
  wonDeals: number;
  pipelineValue: number;
  dealsByStage: {
    [key: string]: {
      count: number;
      value: number;
    };
  };
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    wonRevenue: number;
    deals: number;
    wonDeals: number;
    spend: number;
  }>;
  revenueBySource: {
    [key: string]: {
      totalRevenue: number;
      deals: number;
      avgDealSize: number;
    };
  };
}

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevenueMetrics | null>(null);

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

    // CSV içeriğini hazırla
    const csvContent = [
      ['Revenue Analytics Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [],
      ['Revenue Metrics'],
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(data.totalRevenue)],
      ['Won Revenue', formatCurrency(data.wonRevenue)],
      ['Pipeline Value', formatCurrency(data.pipelineValue)],
      ['Forecasted Revenue', formatCurrency(data.forecastedRevenue)],
      [],
      ['Revenue by Stage'],
      ['Stage', 'Count', 'Value'],
      ...Object.entries(data.dealsByStage).map(([stage, metrics]) => [
        stage,
        metrics.count,
        formatCurrency(metrics.value)
      ]),
      [],
      ['Revenue Over Time'],
      ['Date', 'Revenue', 'Won Revenue', 'Deals', 'Won Deals', 'Spend'],
      ...data.revenueOverTime.map(day => [
        new Date(day.date).toLocaleDateString(),
        formatCurrency(day.revenue),
        formatCurrency(day.wonRevenue),
        day.deals,
        day.wonDeals,
        formatCurrency(day.spend)
      ]),
      [],
      ['Revenue by Source'],
      ['Source', 'Total Revenue', 'Deals', 'Avg Deal Size'],
      ...Object.entries(data.revenueBySource).map(([source, metrics]) => [
        source,
        formatCurrency(metrics.totalRevenue),
        metrics.deals,
        formatCurrency(metrics.avgDealSize)
      ])
    ].map(row => row.join(',')).join('\n');

    // CSV dosyasını indir
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
                {formatCurrency(data.totalRevenue)}
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
                {formatCurrency(data.wonRevenue)}
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
                {formatCurrency(data.pipelineValue)}
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
                {formatCurrency(data.forecastedRevenue)}
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
          {Object.entries(data.dealsByStage).map(([stage, metrics]) => {
            // Stage ismini daha okunabilir hale getir
            const stageName = stage
              .replace(/([A-Z])/g, ' $1') // CamelCase'i boşluklarla ayır
              .split('_') // Snake case'i böl
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Her kelimenin ilk harfini büyük yap
              .join(' ');

            // Progress bar için renk belirle
            const getStageColor = (stageName: string) => {
              const colors: { [key: string]: string } = {
                'Appointment Scheduled': 'bg-blue-500',
                'Qualified': 'bg-green-500',
                'Presentation': 'bg-yellow-500',
                'Proposal': 'bg-orange-500',
                'Negotiation': 'bg-red-500',
                'Closed Won': 'bg-emerald-500',
                'Closed Lost': 'bg-gray-500'
              };
              // Varsayılan renk
              return colors[stageName.split(' ')[0]] || 'bg-blue-500';
            };

            return (
              <div key={stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStageColor(stageName)}`} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {stageName}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({metrics.count} {metrics.count === 1 ? 'deal' : 'deals'})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {((metrics.value / data.totalRevenue) * 100).toFixed(1)}%
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(metrics.value)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getStageColor(stageName)}`}
                    style={{ width: `${Math.max((metrics.value / data.totalRevenue) * 100, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Over Time Charts */}
      <div className="space-y-6">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Trends</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Total Revenue"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="wonRevenue" 
                  name="Won Revenue"
                  stroke="#10b981" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Comparison</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="revenue" name="Total Revenue" fill="#3b82f6" />
                <Bar dataKey="wonRevenue" name="Won Revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cumulative Revenue</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Total Revenue" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  stroke="#3b82f6"
                />
                <Area 
                  type="monotone" 
                  dataKey="wonRevenue" 
                  name="Won Revenue" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  stroke="#10b981"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Distribution</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(data.revenueBySource).map(([source, metrics]) => ({
                    name: source,
                    value: metrics.totalRevenue
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={150}
                  fill="#8884d8"
                >
                  {Object.entries(data.revenueBySource).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={[
                        '#3b82f6',
                        '#10b981',
                        '#6366f1',
                        '#ec4899',
                        '#f59e0b',
                        '#8b5cf6'
                      ][index % 6]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue by Source */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
    </div>
  );
} 