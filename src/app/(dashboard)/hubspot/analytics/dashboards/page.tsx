"use client";

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  PlusCircle,
  Settings,
  Trash2,
  MoveVertical,
  Download,
  Edit,
  LineChart as LineChartIcon,
  X
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
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart';
  title: string;
  size: 'small' | 'medium' | 'large';
  chartType?: 'line' | 'bar' | 'area' | 'pie';
  dataSource: 'deals' | 'campaigns' | 'contacts';
  metric?: string;
  timeRange?: string;
  config?: any;
}

interface DashboardData {
  summary: {
    totalRevenue: number;
    wonRevenue: number;
    totalDeals: number;
    wonDeals: number;
    totalContacts: number;
    activeContacts: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    roi: number;
  };
  performanceData: Array<{
    date: string;
    revenue: number;
    wonRevenue: number;
    deals: number;
    wonDeals: number;
    contacts: number;
    spend: number;
  }>;
}

// Widget seçeneklerini tanımlayalım
const WIDGET_OPTIONS = {
  metrics: [
    { id: 'totalRevenue', title: 'Total Revenue', icon: DollarSign },
    { id: 'wonRevenue', title: 'Won Revenue', icon: Target },
    { id: 'totalDeals', title: 'Total Deals', icon: BarChart3 },
    { id: 'wonDeals', title: 'Won Deals', icon: Target },
    { id: 'totalContacts', title: 'Total Contacts', icon: Users },
    { id: 'activeContacts', title: 'Active Contacts', icon: Users },
    { id: 'roi', title: 'ROI', icon: TrendingUp }
  ],
  charts: [
    { 
      id: 'revenueTrend', 
      title: 'Revenue Trend', 
      type: 'line' as const,
      metrics: ['revenue', 'wonRevenue'],
      icon: LineChartIcon 
    },
    { 
      id: 'dealDistribution', 
      title: 'Deal Distribution', 
      type: 'pie' as const,
      metrics: ['totalDeals', 'wonDeals'],
      icon: PieChart 
    },
    { 
      id: 'contactGrowth', 
      title: 'Contact Growth', 
      type: 'area' as const,
      metrics: ['contacts'],
      icon: Users 
    },
    { 
      id: 'dealProgress', 
      title: 'Deal Progress', 
      type: 'bar' as const,
      metrics: ['deals', 'wonDeals'],
      icon: BarChart3 
    }
  ]
};

interface DraggableWidgetProps {
  widget: DashboardWidget;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  data: DashboardData;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
}

const DraggableWidget = ({ 
  widget, 
  index, 
  moveWidget, 
  onEdit, 
  onDelete, 
  data,
  formatCurrency,
  formatNumber 
}: DraggableWidgetProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'WIDGET',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveWidget(item.index, index);
        item.index = index;
      }
    },
  });

  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
  };

  return (
    <div
      ref={dragDropRef}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease-in-out'
      }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
        widget.size === 'large' ? 'col-span-full' :
        widget.size === 'medium' ? 'md:col-span-2' :
        ''
      } cursor-move hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {widget.title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(widget.id)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Edit className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(widget.id)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
          <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move">
            <MoveVertical className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Widget Content */}
      {widget.type === 'metric' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {widget.metric === 'totalRevenue' && formatCurrency(data.summary.totalRevenue)}
              {widget.metric === 'totalDeals' && formatNumber(data.summary.totalDeals)}
              {widget.metric === 'wonRevenue' && formatCurrency(data.summary.wonRevenue)}
              {widget.metric === 'wonDeals' && formatNumber(data.summary.wonDeals)}
              {widget.metric === 'totalContacts' && formatNumber(data.summary.totalContacts)}
              {widget.metric === 'activeContacts' && formatNumber(data.summary.activeContacts)}
              {widget.metric === 'roi' && `${data.summary.roi.toFixed(1)}%`}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            {widget.metric?.includes('Revenue') ? (
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : widget.metric?.includes('Deals') ? (
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : widget.metric?.includes('Contacts') ? (
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>
      )}

      {widget.type === 'chart' && (
        <div className={`${
          widget.chartType === 'line' ? 'h-[400px]' : 
          widget.chartType === 'pie' ? 'h-[350px]' :
          'h-[300px]'
        }`}>
          <ResponsiveContainer width="100%" height="100%">
            {widget.chartType === 'line' ? (
              <LineChart data={data.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
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
            ) : widget.chartType === 'pie' ? (
              <PieChart>
                <Pie
                  dataKey="value"
                  data={[
                    { name: 'Won Deals', value: data.summary.wonDeals },
                    { name: 'Open Deals', value: data.summary.totalDeals - data.summary.wonDeals }
                  ]}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            ) : (
              <LineChart data={[]}>
                <Line type="monotone" dataKey="value" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default function CustomDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);
  
  // Default widgets
  const defaultWidgets: DashboardWidget[] = [
    {
      id: '1',
      type: 'metric',
      title: 'Total Revenue',
      size: 'small',
      dataSource: 'deals',
      metric: 'totalRevenue'
    },
    {
      id: '2',
      type: 'metric',
      title: 'Total Deals',
      size: 'small',
      dataSource: 'deals',
      metric: 'totalDeals'
    },
    {
      id: '3',
      type: 'chart',
      title: 'Revenue Trends',
      size: 'large',
      chartType: 'line',
      dataSource: 'deals',
      config: {
        metrics: ['revenue', 'wonRevenue']
      }
    },
    {
      id: '4',
      type: 'chart',
      title: 'Deal Distribution',
      size: 'medium',
      chartType: 'pie',
      dataSource: 'deals',
      config: {
        metric: 'deals'
      }
    }
  ];

  // Initialize widgets from localStorage or use defaults
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWidgets = localStorage.getItem('dashboard_widgets');
      return savedWidgets ? JSON.parse(savedWidgets) : defaultWidgets;
    }
    return defaultWidgets;
  });

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
    }
  }, [widgets]);

  // Reset widgets to default
  const handleResetWidgets = () => {
    setWidgets(defaultWidgets);
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth('/api/hubspot/analytics/dashboards');
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleAddWidget = () => {
    setIsAddingWidget(true);
  };

  const handleEditWidget = (widgetId: string) => {
    setEditingWidget(widgetId);
  };

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const handleExport = () => {
    if (!data) return;

    const csvContent = [
      ['Custom Dashboard Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [],
      ['Summary Metrics'],
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(data.summary.totalRevenue)],
      ['Won Revenue', formatCurrency(data.summary.wonRevenue)],
      ['Total Deals', data.summary.totalDeals],
      ['Won Deals', data.summary.wonDeals],
      ['Total Contacts', data.summary.totalContacts],
      ['Active Contacts', data.summary.activeContacts],
      ['Total Campaigns', data.summary.totalCampaigns],
      ['Active Campaigns', data.summary.activeCampaigns],
      ['Total Spend', formatCurrency(data.summary.totalSpend)],
      ['ROI', formatPercentage(data.summary.roi)],
      [],
      ['Performance Over Time'],
      ['Date', 'Revenue', 'Won Revenue', 'Deals', 'Won Deals', 'Contacts', 'Spend'],
      ...data.performanceData.map(day => [
        new Date(day.date).toLocaleDateString(),
        formatCurrency(day.revenue),
        formatCurrency(day.wonRevenue),
        day.deals,
        day.wonDeals,
        day.contacts,
        formatCurrency(day.spend)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `custom-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[dragIndex];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    setWidgets(newWidgets);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <span>Loading dashboard...</span>
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
          No dashboard data available.
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and customize your own analytics dashboard
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddWidget}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Widget
            </button>
            <button
              onClick={handleResetWidgets}
              className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Reset Layout
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 [perspective:1000px]">
          {widgets.map((widget, index) => (
            <div 
              key={widget.id}
              className={`transform-gpu transition-transform duration-200 ease-in-out ${
                widget.type === 'chart' && widget.chartType === 'line' ? 'lg:col-span-4' :
                widget.type === 'chart' && widget.chartType === 'pie' ? 'lg:col-span-2' :
                'lg:col-span-1'
              }`}
            >
              <DraggableWidget
                widget={widget}
                index={index}
                moveWidget={moveWidget}
                onEdit={handleEditWidget}
                onDelete={handleDeleteWidget}
                data={data}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
              />
            </div>
          ))}
        </div>

        {/* Add Widget Modal */}
        {isAddingWidget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Widget</h2>
                <button
                  onClick={() => setIsAddingWidget(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Widget Type Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Metric Widgets</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {WIDGET_OPTIONS.metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <button
                        key={metric.id}
                        onClick={() => {
                          const newWidget: DashboardWidget = {
                            id: Date.now().toString(),
                            type: 'metric',
                            title: metric.title,
                            size: 'small',
                            dataSource: 'deals',
                            metric: metric.id
                          };
                          setWidgets([...widgets, newWidget]);
                          setIsAddingWidget(false);
                        }}
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium">{metric.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Chart Widgets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WIDGET_OPTIONS.charts.map((chart) => {
                    const Icon = chart.icon;
                    return (
                      <button
                        key={chart.id}
                        onClick={() => {
                          const newWidget: DashboardWidget = {
                            id: Date.now().toString(),
                            type: 'chart',
                            title: chart.title,
                            size: chart.type === 'line' ? 'large' : 'medium',
                            chartType: chart.type,
                            dataSource: 'deals',
                            config: {
                              metrics: chart.metrics
                            }
                          };
                          setWidgets([...widgets, newWidget]);
                          setIsAddingWidget(false);
                        }}
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{chart.title}</span>
                          <span className="text-sm text-gray-500">{chart.type} chart</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsAddingWidget(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
} 