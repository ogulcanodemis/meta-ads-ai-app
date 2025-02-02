"use client";

import { useState, useEffect } from 'react';
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
  Bar
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon } from 'lucide-react';

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
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  startDate: string;
  endDate: string;
  targetAudience: {
    age: string[];
    gender: string[];
    interests: string[];
    location: string[];
  };
  performance: {
    ctr: number;
    cpc: number;
    roas: number;
    conversionRate: number;
  };
  dailyStats: {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching campaigns...');
      
      const response = await fetchWithAuth<ApiResponse>('/meta/campaigns');
      console.log('API Response:', response);

      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }

      // Transform API data to match our interface
      const transformedCampaigns = response.data.campaigns.map((campaign: ApiCampaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0,
        spend: campaign.insights?.data?.[0]?.spend ? parseFloat(campaign.insights.data[0].spend) : 0,
        impressions: campaign.insights?.data?.[0]?.impressions || 0,
        clicks: campaign.insights?.data?.[0]?.clicks || 0,
        conversions: campaign.insights?.data?.[0]?.conversions || 0,
        revenue: campaign.insights?.data?.[0]?.revenue || 0,
        startDate: campaign.start_time,
        endDate: campaign.end_time || '',
        targetAudience: {
          age: [],
          gender: [],
          interests: [],
          location: []
        },
        performance: {
          ctr: campaign.insights?.data?.[0]?.ctr || 0,
          cpc: campaign.insights?.data?.[0]?.cpc || 0,
          roas: campaign.insights?.data?.[0]?.roas || 0,
          conversionRate: campaign.insights?.data?.[0]?.conversion_rate || 0
        },
        dailyStats: campaign.insights?.data?.[0]?.daily_stats?.map((stat: ApiCampaignInsightStat) => ({
          date: stat.date_start,
          spend: parseFloat(stat.spend) || 0,
          impressions: stat.impressions || 0,
          clicks: stat.clicks || 0,
          conversions: stat.conversions || 0,
          revenue: stat.revenue || 0
        })) || []
      }));

      console.log('Transformed campaigns:', transformedCampaigns);
      setCampaigns(transformedCampaigns);
      
      if (transformedCampaigns.length > 0) {
        setSelectedCampaign(transformedCampaigns[0]);
        generateAIInsights(transformedCampaigns[0]);
      }

    } catch (err) {
      console.error('Error in fetchCampaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = (campaign: Campaign) => {
    const insights: AIInsight[] = [];
    
    // Ensure performance data exists with default values
    const performance = campaign.performance || {
      roas: 0,
      ctr: 0,
      cpc: 0,
      conversionRate: 0
    };

    // ROAS Analysis
    if (performance.roas < 2) {
      insights.push({
        type: 'warning',
        message: 'ROAS is below target threshold',
        recommendation: 'Consider adjusting bid strategy or reviewing targeting options',
        impact: 'high'
      });
    }

    // CTR Analysis
    if (performance.ctr < 1) {
      insights.push({
        type: 'warning',
        message: 'Click-through rate is below industry average',
        recommendation: 'Review ad creative and copy for improvement opportunities',
        impact: 'medium'
      });
    }

    // Budget Utilization
    const budgetUtilization = campaign.spend && campaign.budget 
      ? (campaign.spend / campaign.budget) * 100 
      : 0;

    if (budgetUtilization > 90) {
      insights.push({
        type: 'info',
        message: 'Budget utilization is high',
        recommendation: 'Consider increasing budget to maintain campaign performance',
        impact: 'medium'
      });
    }

    // Performance Trends
    const dailyStats = campaign.dailyStats || [];
    const recentStats = dailyStats.slice(-7);
    
    if (recentStats.length > 0) {
      const recentConversionRate = recentStats.reduce((acc, stat) => {
        const clicks = stat.clicks || 0;
        const conversions = stat.conversions || 0;
        return acc + (clicks > 0 ? conversions / clicks : 0);
      }, 0) / recentStats.length;

      if (recentConversionRate > (performance.conversionRate || 0)) {
        insights.push({
          type: 'success',
          message: 'Conversion rate is improving',
          recommendation: 'Consider increasing budget to capitalize on good performance',
          impact: 'high'
        });
      }
    }

    setInsights(insights);
  };

  const renderPerformanceChart = () => {
    if (!selectedCampaign?.dailyStats?.length) return null;

    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Daily campaign metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedCampaign.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#8884d8" name="Clicks" />
                <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ffc658" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAudienceInsights = () => {
    if (!selectedCampaign?.targetAudience) return null;

    const { targetAudience } = selectedCampaign;

    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle>Audience Insights</CardTitle>
          <CardDescription>Target audience analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Demographics</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Age Groups:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(targetAudience.age || []).map((age) => (
                      <Badge key={age} variant="secondary">{age}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Gender:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(targetAudience.gender || []).map((gender) => (
                      <Badge key={gender} variant="secondary">{gender}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {(targetAudience.interests || []).map((interest) => (
                  <Badge key={interest} variant="outline">{interest}</Badge>
                ))}
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

  if (loading) {
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
        <Button onClick={() => window.location.href = '/campaigns/new'}>
          Create Campaign
        </Button>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Campaign List */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaigns.map((campaign) => (
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
                        {new Date(selectedCampaign.startDate).toLocaleDateString()} - 
                        {new Date(selectedCampaign.endDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={selectedCampaign.status === 'active' ? 'default' : 'secondary'}>
                      {selectedCampaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="audience">Audience</TabsTrigger>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Budget</CardTitle>
                            <div className="text-2xl font-bold">${selectedCampaign.budget}</div>
                            <CardDescription>
                              Spent: ${selectedCampaign.spend} ({((selectedCampaign.spend / selectedCampaign.budget) * 100).toFixed(1)}%)
                            </CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                            <div className="text-2xl font-bold">{selectedCampaign.performance.roas.toFixed(2)}x</div>
                            <CardDescription>
                              Revenue: ${selectedCampaign.revenue}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">CTR</CardTitle>
                            <div className="text-2xl font-bold">{(selectedCampaign.performance.ctr * 100).toFixed(2)}%</div>
                            <CardDescription>
                              {selectedCampaign.clicks} clicks / {selectedCampaign.impressions} impressions
                            </CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                            <div className="text-2xl font-bold">
                              {(selectedCampaign.performance.conversionRate * 100).toFixed(2)}%
                            </div>
                            <CardDescription>
                              {selectedCampaign.conversions} conversions
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="performance">
                      {renderPerformanceChart()}
                    </TabsContent>

                    <TabsContent value="audience">
                      {renderAudienceInsights()}
                    </TabsContent>

                    <TabsContent value="insights">
                      {renderAIInsights()}
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