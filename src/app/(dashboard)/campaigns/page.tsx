"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/utils/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ApiCampaignInsightStat {
  date_start: string;
  spend: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface ApiCampaignInsight {
  data: Array<{
    spend: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    roas: number;
    conversion_rate: number;
    daily_stats?: ApiCampaignInsightStat[];
  }>;
  paging: any;
}

interface ApiCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  start_time: string;
  end_time?: string;
  insights?: ApiCampaignInsight;
  adAccountId: string;
  adAccountName: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  start_time: string;
  end_time?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  adAccountId: string;
  adAccountName: string;
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpc: number;
    reach: number;
    frequency: number;
    uniqueClicks: number;
    uniqueCtr: number;
    costPerUniqueClick: number;
    outboundClicks: number;
    outboundClicksCtr: number;
    engagementRate: number;
    qualityRanking: string;
    engagementRateRanking: string;
    conversionRateRanking: string;
    linkClicks: number;
    pageEngagement: number;
    leads: number;
    purchases: number;
    costPerLead: number;
    costPerPurchase: number;
    conversions: number;
    daily_stats?: Array<{
      date_start: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
  };
}

interface AIInsight {
  type: 'success' | 'warning' | 'info';
  message: string;
  recommendation?: string;
  impact?: 'high' | 'medium' | 'low';
}

interface ApiResponse {
  data: {
    campaigns: ApiCampaign[];
  };
  success: boolean;
  message: string;
}

// Cache helper functions
const CACHE_KEY = 'meta_ai_campaigns_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

const setCachedData = (data: Campaign[]) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

export default function CampaignsPage() {
  // Helper functions for number formatting
  const formatNumber = (value: any, decimals = 2) => {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  const formatWithCommas = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Add new state variables for filters
  const [filters, setFilters] = useState({
    status: '',
    objective: '',
    adAccount: '',
    dateRange: {
      from: undefined,
      to: undefined
    } as DateRange,
    search: '',
    performanceMetric: '',
    performanceValue: ''
  });

  // Add filtered campaigns state
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);

  // Add unique values helper
  const getUniqueValues = (key: keyof Campaign) => {
    return Array.from(new Set(campaigns.map(campaign => campaign[key])));
  };

  // Add filter function
  const applyFilters = useCallback(() => {
    let result = [...campaigns];

    // Status filter
    if (filters.status && filters.status !== 'all_statuses') {
      result = result.filter(campaign => campaign.status === filters.status);
    }

    // Objective filter
    if (filters.objective && filters.objective !== 'all_objectives') {
      result = result.filter(campaign => campaign.objective === filters.objective);
    }

    // Ad Account filter
    if (filters.adAccount && filters.adAccount !== 'all_accounts') {
      result = result.filter(campaign => campaign.adAccountId === filters.adAccount);
    }

    // Date range filter
    if (filters.dateRange.from && filters.dateRange.to) {
      result = result.filter(campaign => {
        const campaignDate = new Date(campaign.start_time);
        return campaignDate >= filters.dateRange.from! && campaignDate <= filters.dateRange.to!;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(campaign => 
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.adAccountName.toLowerCase().includes(searchLower)
      );
    }

    // Performance metric filter
    if (filters.performanceMetric && filters.performanceMetric !== 'all_performance' && filters.performanceValue) {
      const value = parseFloat(filters.performanceValue);
      if (!isNaN(value)) {
        result = result.filter(campaign => {
          const metrics = campaign.metrics;
          switch (filters.performanceMetric) {
            case 'ctr_above':
              return metrics.ctr > value;
            case 'ctr_below':
              return metrics.ctr < value;
            case 'cpc_above':
              return metrics.cpc > value;
            case 'cpc_below':
              return metrics.cpc < value;
            case 'spend_above':
              return metrics.spend > value;
            case 'spend_below':
              return metrics.spend < value;
            default:
              return true;
          }
        });
      }
    }

    setFilteredCampaigns(result);
  }, [campaigns, filters]);

  // Update filtered campaigns when filters or campaigns change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Modify fetchCampaigns to handle caching
  const fetchCampaigns = async (forceRefresh = false) => {
    try {
      // If not forcing refresh, try to get cached data
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          console.log('Using cached data');
          setCampaigns(cachedData);
          if (cachedData.length > 0) {
            setSelectedCampaign(cachedData[0]);
            generateAIInsights(cachedData[0]);
          }
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      console.log('Fetching campaigns...');
      
      const response = await fetchWithAuth('/meta/campaigns');
      console.log('Campaigns response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch campaigns');
      }

      const transformedCampaigns = response.data.campaigns.map((campaign: ApiCampaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0,
        lifetime_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0,
        start_time: campaign.start_time,
        end_time: campaign.end_time,
        adAccountId: campaign.adAccountId,
        adAccountName: campaign.adAccountName,
        metrics: {
          impressions: campaign.insights?.data?.[0]?.impressions || 0,
          clicks: campaign.insights?.data?.[0]?.clicks || 0,
          spend: campaign.insights?.data?.[0]?.spend ? parseFloat(campaign.insights.data[0].spend) : 0,
          ctr: campaign.insights?.data?.[0]?.ctr || 0,
          cpc: campaign.insights?.data?.[0]?.cpc || 0,
          roas: campaign.insights?.data?.[0]?.roas || 0,
          conversionRate: campaign.insights?.data?.[0]?.conversion_rate || 0,
          conversions: campaign.insights?.data?.[0]?.conversions || 0,
          daily_stats: campaign.insights?.data?.[0]?.daily_stats?.map(stat => ({
            ...stat,
            spend: parseFloat(stat.spend)
          })) || []
        }
      }));

      // Update cache with new data
      setCachedData(transformedCampaigns);
      
      console.log('Transformed campaigns:', transformedCampaigns);
      setCampaigns(transformedCampaigns);
      
      if (transformedCampaigns.length > 0) {
        setSelectedCampaign(transformedCampaigns[0]);
        generateAIInsights(transformedCampaigns[0]);
      }

    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Handle sync button click
  const handleSync = useCallback(() => {
    setIsSyncing(true);
    fetchCampaigns(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns(false);
  }, []);

  const generateAIInsights = (campaign: Campaign) => {
    // Simplified insights generation
    const insights: AIInsight[] = [];
    
    if (campaign.metrics.ctr < 1) {
      insights.push({
        type: 'warning',
        message: 'Click-through rate is below average',
        recommendation: 'Consider reviewing ad creative and targeting',
        impact: 'medium'
      });
    }

    if (campaign.metrics.cpc > 10) {
      insights.push({
        type: 'warning',
        message: 'Cost per click is high',
        recommendation: 'Review bidding strategy and audience targeting',
        impact: 'high'
      });
    }

    setInsights(insights);
  };

  const renderMetrics = (campaign: Campaign) => {
    const { metrics } = campaign;
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">Spend</h3>
          <p className="text-2xl font-semibold">${formatNumber(metrics.spend)}</p>
          <p className="text-sm text-gray-400">{formatWithCommas(metrics.impressions)} impressions</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">CTR</h3>
          <p className="text-2xl font-semibold">{formatNumber(metrics.ctr)}%</p>
          <p className="text-sm text-gray-400">{formatWithCommas(metrics.clicks)} clicks</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">CPC</h3>
          <p className="text-2xl font-semibold">${formatNumber(metrics.cpc)}</p>
          <p className="text-sm text-gray-400">Cost per click</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">Status</h3>
          <p className="text-2xl font-semibold capitalize">{campaign.status.toLowerCase()}</p>
          <p className="text-sm text-gray-400">{campaign.objective?.replace('OUTCOME_', '')}</p>
        </div>
      </div>
    );
  };

  const renderCampaignInfo = (campaign: Campaign) => {
    const { metrics } = campaign;
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>{campaign.adAccountName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Campaign Information</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Campaign ID:</span>
                  <p className="font-mono text-sm">{campaign.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Start Date:</span>
                  <p>{campaign.start_time ? new Date(campaign.start_time).toLocaleDateString() : 'Not set'}</p>
                </div>
                {campaign.end_time && (
                  <div>
                    <span className="text-sm text-gray-500">End Date:</span>
                    <p>{new Date(campaign.end_time).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Objective:</span>
                  <p className="capitalize">{campaign.objective?.replace('OUTCOME_', '').toLowerCase()}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Total Impressions:</span>
                  <p>{formatWithCommas(metrics.impressions)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Clicks:</span>
                  <p>{formatWithCommas(metrics.clicks)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Spend:</span>
                  <p>${formatNumber(metrics.spend)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Click-through Rate:</span>
                  <p>{formatNumber(metrics.ctr)}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedAnalytics = (campaign: Campaign) => {
    const { metrics } = campaign;

    // Helper function to format ranking text
    const formatRanking = (ranking: string | undefined) => {
      if (!ranking || ranking === 'UNKNOWN') return 'Not available';
      return ranking.toLowerCase().replace('_', ' ');
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>Advanced performance metrics and rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reach & Frequency */}
            <div className="space-y-4">
              <h4 className="font-medium">Reach & Frequency</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Total Reach:</span>
                  <p className="font-medium">{formatWithCommas(metrics.reach)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Frequency:</span>
                  <p className="font-medium">{formatNumber(metrics.frequency)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Unique Clicks:</span>
                  <p className="font-medium">{formatWithCommas(metrics.uniqueClicks)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Unique CTR:</span>
                  <p className="font-medium">{formatNumber(metrics.uniqueCtr)}%</p>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium">Engagement</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Link Clicks:</span>
                  <p className="font-medium">{formatWithCommas(metrics.linkClicks)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Page Engagement:</span>
                  <p className="font-medium">{formatWithCommas(metrics.pageEngagement)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Engagement Rate:</span>
                  <p className="font-medium">{formatNumber(metrics.engagementRate)}%</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Outbound CTR:</span>
                  <p className="font-medium">{formatNumber(metrics.outboundClicksCtr)}%</p>
                </div>
              </div>
            </div>

            {/* Conversion Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium">Conversions</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Leads:</span>
                  <p className="font-medium">{formatWithCommas(metrics.leads)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Purchases:</span>
                  <p className="font-medium">{formatWithCommas(metrics.purchases)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Cost per Lead:</span>
                  <p className="font-medium">${formatNumber(metrics.costPerLead)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Cost per Purchase:</span>
                  <p className="font-medium">${formatNumber(metrics.costPerPurchase)}</p>
                </div>
              </div>
            </div>

            {/* Rankings */}
            <div className="md:col-span-3 mt-4">
              <h4 className="font-medium mb-4">Campaign Rankings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h5 className="text-sm text-gray-400">Quality Ranking</h5>
                  <p className="text-lg font-semibold capitalize">{formatRanking(metrics.qualityRanking)}</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h5 className="text-sm text-gray-400">Engagement Ranking</h5>
                  <p className="text-lg font-semibold capitalize">{formatRanking(metrics.engagementRateRanking)}</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h5 className="text-sm text-gray-400">Conversion Ranking</h5>
                  <p className="text-lg font-semibold capitalize">{formatRanking(metrics.conversionRateRanking)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAIInsights = () => {
    if (!insights.length) return null;

    return (
      <div className="space-y-4 mt-4">
        {insights.map((insight, index) => (
          <Alert key={index} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              {insight.type === 'success' && <TrendingUpIcon className="h-4 w-4 text-green-500" />}
              {insight.type === 'warning' && <TrendingDownIcon className="h-4 w-4 text-red-500" />}
              {insight.type === 'info' && <InfoIcon className="h-4 w-4 text-blue-500" />}
              {insight.message}
              {insight.impact && (
                <Badge variant={insight.impact === 'high' ? 'destructive' : 'default'}>
                  {insight.impact} impact
                </Badge>
              )}
            </AlertTitle>
            {insight.recommendation && (
              <AlertDescription>{insight.recommendation}</AlertDescription>
            )}
          </Alert>
        ))}
      </div>
    );
  };

  // Add filter components
  const renderFilters = () => {
    const uniqueStatuses = Array.from(new Set(campaigns.map(c => c.status)));
    const uniqueObjectives = Array.from(new Set(campaigns.map(c => c.objective)));
    // Update uniqueAccounts to ensure uniqueness based on both id and name
    const uniqueAccounts = Array.from(
      new Map(
        campaigns.map(c => [c.adAccountId, { id: c.adAccountId, name: c.adAccountName }])
      ).values()
    );

    const performanceMetrics = [
      { label: 'CTR Above', value: 'ctr_above' },
      { label: 'CTR Below', value: 'ctr_below' },
      { label: 'CPC Above', value: 'cpc_above' },
      { label: 'CPC Below', value: 'cpc_below' },
      { label: 'Spend Above', value: 'spend_above' },
      { label: 'Spend Below', value: 'spend_below' },
    ];

    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
              <SelectItem value="all_statuses">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={`status-${status}`} value={status}>
                  {status.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Objective Filter */}
          <Select
            value={filters.objective}
            onValueChange={(value) => setFilters(prev => ({ ...prev, objective: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Objective" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
              <SelectItem value="all_objectives">All Objectives</SelectItem>
              {uniqueObjectives.map((objective) => (
                <SelectItem key={`objective-${objective}`} value={objective}>
                  {objective.replace('OUTCOME_', '').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ad Account Filter */}
          <Select
            value={filters.adAccount}
            onValueChange={(value) => setFilters(prev => ({ ...prev, adAccount: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Ad Account" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
              <SelectItem value="all_accounts">All Ad Accounts</SelectItem>
              {uniqueAccounts.map((account) => (
                <SelectItem key={`account-${account.id}`} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Filter */}
          <DatePickerWithRange
            value={filters.dateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))}
          />

          {/* Search Filter */}
          <Input
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full"
          />

          {/* Performance Metric Filter */}
          <div className="flex gap-2">
            <Select
              value={filters.performanceMetric}
              onValueChange={(value) => setFilters(prev => ({ ...prev, performanceMetric: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Performance Filter" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
                <SelectItem value="all_performance">All Performance</SelectItem>
                {performanceMetrics.map((metric) => (
                  <SelectItem key={`metric-${metric.value}`} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.performanceMetric && filters.performanceMetric !== 'all_performance' && (
              <Input
                type="number"
                placeholder="Value"
                value={filters.performanceValue}
                onChange={(e) => setFilters(prev => ({ ...prev, performanceValue: e.target.value }))}
                className="w-24"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            variant="outline"
            disabled={isSyncing}
            className={cn(
              "gap-2",
              isSyncing && "opacity-70 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            {isSyncing ? "Syncing..." : "Sync Campaigns"}
          </Button>
          <Button onClick={() => window.location.href = '/campaigns/new'}>
            Create Campaign
          </Button>
        </div>
      </div>

      {renderFilters()}

      <div className="grid md:grid-cols-12 gap-6">
        {/* Campaign List */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Campaigns</CardTitle>
              <CardDescription>{filteredCampaigns.length} campaigns found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCampaigns.map((campaign) => (
                  <Button
                    key={campaign.id}
                    variant={selectedCampaign?.id === campaign.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      generateAIInsights(campaign);
                    }}
                  >
                    <span className="truncate">{campaign.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <div className="md:col-span-9">
          {selectedCampaign && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedCampaign.name}</CardTitle>
                      <CardDescription>
                        {selectedCampaign.start_time ? new Date(selectedCampaign.start_time).toLocaleDateString() : 'No start date'} - 
                        {selectedCampaign.end_time ? new Date(selectedCampaign.end_time).toLocaleDateString() : 'No end date'}
                      </CardDescription>
                    </div>
                    <Badge variant={selectedCampaign.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                      {selectedCampaign.status.toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                      <TabsTrigger value="daily">Daily Stats</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      {renderMetrics(selectedCampaign)}
                      {renderCampaignInfo(selectedCampaign)}
                      
                      {/* Performance Charts */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Trend</CardTitle>
                          <CardDescription>Overall campaign performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="line">
                            <TabsList className="mb-4">
                              <TabsTrigger value="line">Line Chart</TabsTrigger>
                              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                              <TabsTrigger value="area">Area Chart</TabsTrigger>
                            </TabsList>

                            <TabsContent value="line">
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={[
                                      {
                                        name: 'Week 1',
                                        spend: selectedCampaign.metrics.spend * 0.2,
                                        impressions: selectedCampaign.metrics.impressions * 0.2,
                                        clicks: selectedCampaign.metrics.clicks * 0.2
                                      },
                                      {
                                        name: 'Week 2',
                                        spend: selectedCampaign.metrics.spend * 0.4,
                                        impressions: selectedCampaign.metrics.impressions * 0.4,
                                        clicks: selectedCampaign.metrics.clicks * 0.4
                                      },
                                      {
                                        name: 'Week 3',
                                        spend: selectedCampaign.metrics.spend * 0.7,
                                        impressions: selectedCampaign.metrics.impressions * 0.7,
                                        clicks: selectedCampaign.metrics.clicks * 0.7
                                      },
                                      {
                                        name: 'Week 4',
                                        spend: selectedCampaign.metrics.spend,
                                        impressions: selectedCampaign.metrics.impressions,
                                        clicks: selectedCampaign.metrics.clicks
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip formatter={(value) => [formatNumber(value), '']} />
                                    <Legend />
                                    <Line
                                      yAxisId="left"
                                      type="monotone"
                                      dataKey="spend"
                                      name="Spend ($)"
                                      stroke="#8884d8"
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="clicks"
                                      name="Clicks"
                                      stroke="#82ca9d"
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="impressions"
                                      name="Impressions"
                                      stroke="#ffc658"
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>

                            <TabsContent value="bar">
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      {
                                        name: 'Metrics',
                                        spend: selectedCampaign.metrics.spend,
                                        clicks: selectedCampaign.metrics.clicks,
                                        impressions: selectedCampaign.metrics.impressions,
                                        ctr: selectedCampaign.metrics.ctr * 1000, // Scaling for visibility
                                        cpc: selectedCampaign.metrics.cpc * 100 // Scaling for visibility
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => {
                                      if (name === 'ctr') return [formatNumber(value/1000) + '%', 'CTR'];
                                      if (name === 'cpc') return ['$' + formatNumber(value/100), 'CPC'];
                                      return [formatNumber(value), name];
                                    }} />
                                    <Legend />
                                    <Bar dataKey="spend" name="Spend ($)" fill="#8884d8" />
                                    <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
                                    <Bar dataKey="impressions" name="Impressions" fill="#ffc658" />
                                    <Bar dataKey="ctr" name="CTR" fill="#ff8042" />
                                    <Bar dataKey="cpc" name="CPC" fill="#00C49F" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>

                            <TabsContent value="area">
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={[
                                      {
                                        name: 'Week 1',
                                        spend: selectedCampaign.metrics.spend * 0.2,
                                        impressions: selectedCampaign.metrics.impressions * 0.2,
                                        clicks: selectedCampaign.metrics.clicks * 0.2
                                      },
                                      {
                                        name: 'Week 2',
                                        spend: selectedCampaign.metrics.spend * 0.4,
                                        impressions: selectedCampaign.metrics.impressions * 0.4,
                                        clicks: selectedCampaign.metrics.clicks * 0.4
                                      },
                                      {
                                        name: 'Week 3',
                                        spend: selectedCampaign.metrics.spend * 0.7,
                                        impressions: selectedCampaign.metrics.impressions * 0.7,
                                        clicks: selectedCampaign.metrics.clicks * 0.7
                                      },
                                      {
                                        name: 'Week 4',
                                        spend: selectedCampaign.metrics.spend,
                                        impressions: selectedCampaign.metrics.impressions,
                                        clicks: selectedCampaign.metrics.clicks
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [formatNumber(value), '']} />
                                    <Legend />
                                    <Area
                                      type="monotone"
                                      dataKey="spend"
                                      name="Spend ($)"
                                      stackId="1"
                                      stroke="#8884d8"
                                      fill="#8884d8"
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="clicks"
                                      name="Clicks"
                                      stackId="2"
                                      stroke="#82ca9d"
                                      fill="#82ca9d"
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="impressions"
                                      name="Impressions"
                                      stackId="3"
                                      stroke="#ffc658"
                                      fill="#ffc658"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>

                      {/* Performance Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Summary</CardTitle>
                          <CardDescription>Detailed campaign metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs uppercase bg-gray-800">
                                <tr>
                                  <th className="px-6 py-3">Metric</th>
                                  <th className="px-6 py-3">Value</th>
                                  <th className="px-6 py-3">Rate/Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Impressions</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.impressions)}</td>
                                  <td className="px-6 py-4">-</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Clicks</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.clicks)}</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.ctr)}% CTR</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Spend</td>
                                  <td className="px-6 py-4">${formatNumber(selectedCampaign.metrics.spend)}</td>
                                  <td className="px-6 py-4">${formatNumber(selectedCampaign.metrics.cpc)} CPC</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Link Clicks</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.linkClicks)}</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.outboundClicksCtr)}% CTR</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Page Engagement</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.pageEngagement)}</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.engagementRate)}%</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Conversions</td>
                                  <td className="px-6 py-4">
                                    Leads: {formatWithCommas(selectedCampaign.metrics.leads)}
                                    <br />
                                    Purchases: {formatWithCommas(selectedCampaign.metrics.purchases)}
                                  </td>
                                  <td className="px-6 py-4">
                                    CPL: ${formatNumber(selectedCampaign.metrics.costPerLead)}
                                    <br />
                                    CPP: ${formatNumber(selectedCampaign.metrics.costPerPurchase)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {renderDetailedAnalytics(selectedCampaign)}
                    </TabsContent>

                    <TabsContent value="insights">
                      {renderAIInsights()}
                    </TabsContent>

                    <TabsContent value="daily" className="space-y-4">
                      {selectedCampaign.metrics.daily_stats && (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Today's Performance</CardTitle>
                              <CardDescription>
                                {format(new Date(), 'dd MMMM yyyy')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's Spend</h3>
                                  <p className="text-2xl font-semibold">
                                    ${formatNumber(selectedCampaign.metrics.daily_stats[0]?.spend || 0)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatWithCommas(selectedCampaign.metrics.daily_stats[0]?.impressions || 0)} impressions
                                  </p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's CTR</h3>
                                  <p className="text-2xl font-semibold">
                                    {formatNumber((selectedCampaign.metrics.daily_stats[0]?.clicks || 0) / 
                                      (selectedCampaign.metrics.daily_stats[0]?.impressions || 1) * 100)}%
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatWithCommas(selectedCampaign.metrics.daily_stats[0]?.clicks || 0)} clicks
                                  </p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's CPC</h3>
                                  <p className="text-2xl font-semibold">
                                    ${formatNumber((selectedCampaign.metrics.daily_stats[0]?.spend || 0) / 
                                      (selectedCampaign.metrics.daily_stats[0]?.clicks || 1))}
                                  </p>
                                  <p className="text-sm text-gray-400">Cost per click</p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's Conversion Rate</h3>
                                  <p className="text-2xl font-semibold">
                                    {formatNumber((selectedCampaign.metrics.daily_stats[0]?.conversions || 0) / 
                                      (selectedCampaign.metrics.daily_stats[0]?.clicks || 1) * 100)}%
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatWithCommas(selectedCampaign.metrics.daily_stats[0]?.conversions || 0)} conversions
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Daily Trend</CardTitle>
                              <CardDescription>Performance over the last 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={selectedCampaign.metrics.daily_stats.slice(0, 7).reverse()}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                      dataKey="date_start" 
                                      tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                                    />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                      labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy')}
                                      formatter={(value) => [formatNumber(value), '']}
                                    />
                                    <Legend />
                                    <Line
                                      yAxisId="left"
                                      type="monotone"
                                      dataKey="spend"
                                      name="Spend ($)"
                                      stroke="#8884d8"
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="clicks"
                                      name="Clicks"
                                      stroke="#82ca9d"
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Daily Statistics</CardTitle>
                              <CardDescription>Detailed daily performance data</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                  <thead className="text-xs uppercase bg-gray-800">
                                    <tr>
                                      <th className="px-6 py-3">Date</th>
                                      <th className="px-6 py-3">Impressions</th>
                                      <th className="px-6 py-3">Clicks</th>
                                      <th className="px-6 py-3">CTR</th>
                                      <th className="px-6 py-3">Spend</th>
                                      <th className="px-6 py-3">CPC</th>
                                      <th className="px-6 py-3">Conversions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedCampaign.metrics.daily_stats.map((stat, index) => (
                                      <tr key={stat.date_start} className="border-b border-gray-800">
                                        <td className="px-6 py-4">
                                          {format(new Date(stat.date_start), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatWithCommas(stat.impressions)}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatWithCommas(stat.clicks)}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatNumber((stat.clicks / stat.impressions) * 100)}%
                                        </td>
                                        <td className="px-6 py-4">
                                          ${formatNumber(stat.spend)}
                                        </td>
                                        <td className="px-6 py-4">
                                          ${formatNumber(stat.spend / stat.clicks)}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatWithCommas(stat.conversions)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 