"use client";

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface PerformanceReport {
  id: string;
  type: 'campaign' | 'deal' | 'contact';
  name: string;
  date: string;
  metrics: {
    revenue?: number;
    spend?: number;
    roi?: number;
    leads?: number;
    deals?: number;
    conversions?: number;
    ctr?: number;
    cpc?: number;
  };
  status: string;
  source: 'Meta' | 'HubSpot';
}

export default function PerformanceReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [dateRange, setDateRange] = useState('last30');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSource, setSelectedSource] = useState<'all' | 'Meta' | 'HubSpot'>('all');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/hubspot/analytics/reports?dateRange=${dateRange}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const formatCurrency = (value?: number) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value?: number) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value?: number) => {
    if (value == null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    if (!reports.length) return;

    const csvContent = [
      ['Performance Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Date Range: ${dateRange}`],
      [],
      ['Name', 'Type', 'Source', 'Date', 'Status', 'Revenue', 'Spend', 'ROI', 'Leads', 'Deals', 'Conversions', 'CTR', 'CPC'],
      ...reports.map(report => [
        report.name,
        report.type,
        report.source,
        new Date(report.date).toLocaleDateString(),
        report.status,
        formatCurrency(report.metrics.revenue),
        formatCurrency(report.metrics.spend),
        formatPercentage(report.metrics.roi),
        formatNumber(report.metrics.leads),
        formatNumber(report.metrics.deals),
        formatNumber(report.metrics.conversions),
        formatPercentage(report.metrics.ctr),
        formatCurrency(report.metrics.cpc)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `performance-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = selectedSource === 'all' || report.source === selectedSource;
      return matchesSearch && matchesSource;
    })
    .sort((a, b) => {
      let aValue = sortField.split('.').reduce((obj, key) => obj?.[key], a as any);
      let bValue = sortField.split('.').reduce((obj, key) => obj?.[key], b as any);
      
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and analyze detailed performance metrics across all channels
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
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value as 'all' | 'Meta' | 'HubSpot')}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Sources</option>
          <option value="Meta">Meta</option>
          <option value="HubSpot">HubSpot</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    <SortIcon field="type" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('source')}
                >
                  <div className="flex items-center gap-1">
                    Source
                    <SortIcon field="source" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon field="date" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('metrics.revenue')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Revenue
                    <SortIcon field="metrics.revenue" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('metrics.spend')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Spend
                    <SortIcon field="metrics.spend" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('metrics.roi')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    ROI
                    <SortIcon field="metrics.roi" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group cursor-pointer"
                  onClick={() => handleSort('metrics.conversions')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Conversions
                    <SortIcon field="metrics.conversions" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(report.metrics.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(report.metrics.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatPercentage(report.metrics.roi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatNumber(report.metrics.conversions)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 