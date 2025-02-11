"use client";

import { useState, useEffect } from 'react';
import { BarChart3, ArrowRight, Filter, Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface DealStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

interface ConversionRate {
  fromStage: string;
  toStage: string;
  rate: number;
}

interface DealTrend {
  date: string;
  count: number;
  value: number;
}

interface PipelineData {
  stages: DealStage[];
  totalValue: number;
  totalDeals: number;
  conversionRates: ConversionRate[];
}

// Pipeline bar için minimum genişlik
const MIN_BAR_WIDTH = 5;

// CSV'ye dönüştürme fonksiyonu
const convertToCSV = (data: PipelineData) => {
  // CSV başlıkları
  const headers = ['Stage', 'Number of Deals', 'Value', 'Percentage of Total'];
  
  // Stage verilerini CSV satırlarına dönüştür
  const stageRows = data.stages.map(stage => [
    stage.name,
    stage.count,
    stage.value,
    `${((stage.value / data.totalValue) * 100).toFixed(1)}%`
  ]);

  // Toplam satırı
  const totalRow = ['TOTAL', data.totalDeals, data.totalValue, '100%'];

  // Boş satır
  const emptyRow = ['', '', '', ''];

  // Conversion rates başlıkları
  const conversionHeaders = ['From Stage', 'To Stage', 'Conversion Rate'];

  // Conversion rates satırları
  const conversionRows = data.conversionRates.map(conv => [
    conv.fromStage,
    conv.toStage,
    `${conv.rate.toFixed(1)}%`
  ]);

  // Tüm satırları birleştir
  const allRows = [
    headers,
    ...stageRows,
    emptyRow,
    totalRow,
    emptyRow,
    conversionHeaders,
    ...conversionRows
  ];

  // CSV formatına dönüştür
  return allRows.map(row => row.join(',')).join('\n');
};

// Dosya indirme fonksiyonu
const downloadCSV = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function PipelineAnalytics() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PipelineData | null>(null);
  const [trends, setTrends] = useState<DealTrend[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/hubspot/analytics/pipeline?dateRange=${dateRange}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data.pipeline);
      setTrends(response.data.trends);
    } catch (err) {
      console.error('Error fetching pipeline data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pipeline data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Progress bar genişliğini hesapla
  const calculateBarWidth = (value: number, total: number) => {
    if (total === 0) return MIN_BAR_WIDTH;
    const percentage = (value / total) * 100;
    return Math.max(percentage, MIN_BAR_WIDTH);
  };

  // Para birimini formatla
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Export fonksiyonu
  const handleExport = () => {
    if (!data) return;

    const date = new Date().toISOString().split('T')[0];
    const fileName = `pipeline-analytics-${date}.csv`;
    const csvContent = convertToCSV(data);
    
    downloadCSV(csvContent, fileName);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <BarChart3 className="w-6 h-6 text-blue-600" />
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
          No pipeline data available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Deal Pipeline Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and analyze your deal pipeline performance
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pipeline Value</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deals</p>
              <p className="text-2xl font-bold mt-1">{data.totalDeals}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Size</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(data.totalDeals > 0 ? data.totalValue / data.totalDeals : 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pipeline Stages</h2>
        <div className="space-y-6">
          {data.stages.map((stage, index) => (
            <div key={stage.name} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stage.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{stage.count} deals</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(stage.value)}</span>
                </div>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${stage.color} transition-all duration-500`}
                  style={{ width: `${calculateBarWidth(stage.value, data.totalValue)}%` }}
                />
              </div>
              {index < data.stages.length - 1 && (
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Stage Conversion Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.conversionRates.map((conversion) => (
            <div key={`${conversion.fromStage}-${conversion.toStage}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {conversion.fromStage} → {conversion.toStage}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {conversion.rate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${conversion.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 