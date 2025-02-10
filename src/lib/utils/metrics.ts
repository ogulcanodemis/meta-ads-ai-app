import { Campaign } from '@/types/campaign';

interface MetricTrend {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface MetricBenchmark {
  value: number;
  industryAvg: number;
  percentile: number;
  rating: 'above' | 'average' | 'below';
}

interface HourlyMetric {
  hour: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

interface DailyMetric {
  dayOfWeek: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

interface AverageMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

// Güvenli hesaplama yardımcı fonksiyonları
const safeDiv = (numerator: number, denominator: number, defaultValue = 0): number => {
  if (denominator === 0 || !denominator) return defaultValue;
  const result = numerator / denominator;
  return isFinite(result) ? result : defaultValue;
};

const safePercentage = (numerator: number, denominator: number, defaultValue = 0): number => {
  return safeDiv(numerator, denominator, defaultValue) * 100;
};

const safeNumber = (value: number | null | undefined, defaultValue = 0): number => {
  if (value === null || value === undefined || !isFinite(value)) return defaultValue;
  return value;
};

// Geliştirilmiş veri doğrulama
export const validateAnalytics = (metrics: Campaign['metrics']) => {
  const validationRules = [
    {
      condition: !metrics,
      message: "Metrics object is required"
    },
    {
      condition: metrics.clicks > metrics.impressions,
      message: "Clicks cannot exceed impressions"
    },
    {
      condition: metrics.conversions > metrics.clicks,
      message: "Conversions cannot exceed clicks"
    },
    {
      condition: metrics.spend < 0,
      message: "Spend cannot be negative"
    },
    {
      condition: metrics.revenue < 0,
      message: "Revenue cannot be negative"
    },
    {
      condition: metrics.uniqueClicks > metrics.clicks,
      message: "Unique clicks cannot exceed total clicks"
    },
    {
      condition: metrics.leads > metrics.conversions,
      message: "Leads cannot exceed total conversions"
    },
    {
      condition: metrics.purchases > metrics.conversions,
      message: "Purchases cannot exceed total conversions"
    }
  ];

  const errors = validationRules
    .filter(rule => rule.condition)
    .map(rule => rule.message);

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
};

// Veri güvenilirlik skoru hesaplama
export const calculateDataReliability = (metrics: Campaign['metrics']): number => {
  const reliabilityChecks = [
    // Temel metrik güvenilirliği
    metrics.impressions > 1000,
    metrics.clicks > 100,
    metrics.spend > 0,
    
    // Oran güvenilirliği
    metrics.ctr < 100,
    safePercentage(metrics.conversions, metrics.clicks) < 100,
    
    // Tutarlılık kontrolleri
    metrics.uniqueClicks <= metrics.clicks,
    metrics.conversions <= metrics.clicks,
    
    // Zaman bazlı veri güvenilirliği
    Boolean(metrics.hourlyPerformance?.length),
    Boolean(metrics.dailyPerformance?.length),
    
    // Kalite metrik güvenilirliği
    metrics.qualityScore !== null,
    metrics.adRelevanceScore !== null
  ];

  return (reliabilityChecks.filter(Boolean).length / reliabilityChecks.length) * 100;
};

export const validateMetrics = (metrics: Campaign['metrics']) => {
  // Temel validasyonlar
  if (metrics.spend < 0) throw new Error("Spend cannot be negative");
  if (metrics.clicks > metrics.impressions) throw new Error("Clicks cannot exceed impressions");
  if (metrics.ctr > 100) throw new Error("CTR cannot exceed 100%");
  if (metrics.conversions > metrics.clicks) throw new Error("Conversions cannot exceed clicks");
};

export const calculateDerivedMetrics = (metrics: Campaign['metrics']) => {
  return {
    ...metrics,
    // CTR hesaplaması
    ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
    
    // CPC hesaplaması
    cpc: metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0,
    
    // ROAS hesaplaması
    roas: metrics.spend > 0 ? metrics.revenue / metrics.spend : 0,
    
    // Dönüşüm oranı hesaplaması
    conversionRate: metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0,
    
    // Benzersiz CTR hesaplaması
    uniqueCtr: metrics.reach > 0 ? (metrics.uniqueClicks / metrics.reach) * 100 : 0,
    
    // Maliyet metrikleri
    costPerUniqueClick: metrics.uniqueClicks > 0 ? metrics.spend / metrics.uniqueClicks : 0,
    costPerLead: metrics.leads > 0 ? metrics.spend / metrics.leads : 0,
    costPerPurchase: metrics.purchases > 0 ? metrics.spend / metrics.purchases : 0,
  };
};

export const calculateMetricTrends = (
  current: Campaign['metrics'], 
  previous: Campaign['metrics']
): Record<string, MetricTrend> => {
  const calculateTrend = (curr: number, prev: number): MetricTrend => {
    const change = curr - prev;
    const changePercentage = prev !== 0 ? (change / prev) * 100 : 0;
    
    return {
      current: curr,
      previous: prev,
      change,
      changePercentage,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  return {
    spend: calculateTrend(current.spend, previous.spend),
    impressions: calculateTrend(current.impressions, previous.impressions),
    clicks: calculateTrend(current.clicks, previous.clicks),
    conversions: calculateTrend(current.conversions, previous.conversions),
    revenue: calculateTrend(current.revenue, previous.revenue),
    ctr: calculateTrend(current.ctr, previous.ctr),
    cpc: calculateTrend(current.cpc, previous.cpc),
    roas: calculateTrend(current.roas, previous.roas),
  };
};

export const getMetricBenchmark = (
  value: number,
  industryAvg: number,
  percentiles: number[]
): MetricBenchmark => {
  const percentile = percentiles.findIndex(p => value <= p) * 10;
  
  return {
    value,
    industryAvg,
    percentile,
    rating: value > industryAvg * 1.1 ? 'above' : 
            value < industryAvg * 0.9 ? 'below' : 'average'
  };
};

export const formatMetricValue = (value: number, type: 'percentage' | 'currency' | 'number' = 'number', decimals = 2) => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  
  switch (type) {
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'currency':
      return `$${value.toFixed(decimals)}`;
    default:
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      });
  }
};

export const getMetricStatus = (
  current: number,
  target: number,
  tolerance = 0.1
): 'success' | 'warning' | 'error' => {
  const ratio = current / target;
  
  if (ratio >= 1) return 'success';
  if (ratio >= 1 - tolerance) return 'warning';
  return 'error';
};

export const analyzeHourlyPerformance = (hourlyData: HourlyMetric[] | undefined) => {
  if (!hourlyData?.length) return null;

  return {
    bestHours: hourlyData
      .sort((a: HourlyMetric, b: HourlyMetric) => b.ctr - a.ctr)
      .slice(0, 3)
      .map((h: HourlyMetric) => h.hour),
      
    worstHours: hourlyData
      .sort((a: HourlyMetric, b: HourlyMetric) => a.ctr - b.ctr)
      .slice(0, 3)
      .map((h: HourlyMetric) => h.hour),
      
    averageMetrics: hourlyData.reduce((acc: AverageMetrics, curr: HourlyMetric) => ({
      impressions: acc.impressions + (curr.impressions / hourlyData.length),
      clicks: acc.clicks + (curr.clicks / hourlyData.length),
      conversions: acc.conversions + (curr.conversions / hourlyData.length),
      ctr: acc.ctr + (curr.ctr / hourlyData.length)
    }), {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0
    })
  };
};

export const analyzeDailyPerformance = (dailyData: DailyMetric[] | undefined) => {
  if (!dailyData?.length) return null;

  return {
    bestDays: dailyData
      .sort((a: DailyMetric, b: DailyMetric) => b.ctr - a.ctr)
      .slice(0, 3)
      .map((d: DailyMetric) => d.dayOfWeek),
      
    worstDays: dailyData
      .sort((a: DailyMetric, b: DailyMetric) => a.ctr - b.ctr)
      .slice(0, 3)
      .map((d: DailyMetric) => d.dayOfWeek),
      
    averageMetrics: dailyData.reduce((acc: AverageMetrics, curr: DailyMetric) => ({
      impressions: acc.impressions + (curr.impressions / dailyData.length),
      clicks: acc.clicks + (curr.clicks / dailyData.length),
      conversions: acc.conversions + (curr.conversions / dailyData.length),
      ctr: acc.ctr + (curr.ctr / dailyData.length)
    }), {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0
    })
  };
};

// Trend ve büyüme analizi fonksiyonları
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const renderTrendIndicator = (current: number, previous: number, inverse = false): string => {
  const change = calculateGrowthRate(current, previous);
  const isPositive = inverse ? change < 0 : change > 0;
  return isPositive ? '↑' : change < 0 ? '↓' : '→';
};

// Engagement ve kalite analizi fonksiyonları
export const calculateEngagementScore = (metrics: Campaign['metrics']): number => {
  const clickThroughScore = (metrics.clicks / metrics.impressions) * 100;
  const conversionScore = (metrics.conversions / metrics.clicks) * 100;
  const frequencyScore = Math.min(metrics.frequency * 10, 100);
  const uniqueClickScore = (metrics.uniqueClicks / metrics.clicks) * 100;
  
  return (clickThroughScore + conversionScore + frequencyScore + uniqueClickScore) / 4;
};

// Zaman bazlı analiz fonksiyonları
export const getPeakHours = (hourlyData: Campaign['metrics']['hourlyPerformance']): string => {
  if (!hourlyData?.length) return 'No data';
  
  const sortedHours = [...hourlyData].sort((a, b) => b.ctr - a.ctr);
  return sortedHours.slice(0, 3).map(h => `${h.hour}:00`).join(', ');
};

export const calculateHourlyVolatility = (hourlyData: Campaign['metrics']['hourlyPerformance']): number => {
  if (!hourlyData?.length) return 0;
  
  let totalChange = 0;
  for (let i = 1; i < hourlyData.length; i++) {
    const change = Math.abs(hourlyData[i].ctr - hourlyData[i-1].ctr);
    totalChange += change;
  }
  
  return (totalChange / (hourlyData.length - 1));
};

export const getBestDays = (dailyData: Campaign['metrics']['dailyPerformance']): string => {
  if (!dailyData?.length) return 'No data';
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sortedDays = [...dailyData].sort((a, b) => b.ctr - a.ctr);
  return sortedDays.slice(0, 3).map(d => days[d.dayOfWeek]).join(', ');
};

export const calculateDailyStability = (dailyData: Campaign['metrics']['dailyPerformance']): number => {
  if (!dailyData?.length) return 0;
  
  const ctrValues = dailyData.map(d => d.ctr);
  const mean = ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length;
  const variance = ctrValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ctrValues.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Coefficient of Variation (CV) tersini alarak stabilite skoru oluşturuyoruz
  return Math.max(0, 100 - (standardDeviation / mean * 100));
};

// Trend analizi ve güvenilirlik
export const calculateTrendStrength = (current: number, previous: number): 'strong' | 'moderate' | 'weak' => {
  const change = Math.abs(calculateGrowthRate(current, previous));
  if (change > 20) return 'strong';
  if (change > 10) return 'moderate';
  return 'weak';
};

export const calculateTrendReliability = (
  current: Campaign['metrics'],
  previous: Campaign['metrics']
): number => {
  const reliabilityChecks = [
    // Veri büyüklüğü kontrolleri
    current.impressions > 1000,
    current.clicks > 100,
    previous.impressions > 1000,
    previous.clicks > 100,
    
    // Mantıksal kontroller
    current.ctr < 100,
    previous.ctr < 100,
    current.conversions <= current.clicks,
    previous.conversions <= previous.clicks,
    
    // Zaman bazlı veri kontrolleri
    Boolean(current.hourlyPerformance?.length),
    Boolean(previous.hourlyPerformance?.length),
    Boolean(current.dailyPerformance?.length),
    Boolean(previous.dailyPerformance?.length)
  ];

  return (reliabilityChecks.filter(Boolean).length / reliabilityChecks.length) * 100;
};

// Performans skor sistemi
export const calculatePerformanceScore = (metrics: Campaign['metrics']): number => {
  // Ağırlıklar
  const weights = {
    ctr: 0.2,
    conversionRate: 0.25,
    roas: 0.25,
    engagementRate: 0.15,
    qualityScore: 0.15
  };

  // Metrik skorları (0-100 arası normalize edilmiş)
  const scores = {
    ctr: Math.min(metrics.ctr * 5, 100), // CTR 20%'ye kadar
    conversionRate: Math.min(safePercentage(metrics.conversions, metrics.clicks) * 5, 100), // Conversion Rate 20%'ye kadar
    roas: Math.min(metrics.roas * 10, 100), // ROAS 10x'e kadar
    engagementRate: Math.min(metrics.engagementRate * 2, 100), // Engagement Rate 50%'ye kadar
    qualityScore: safeNumber(metrics.qualityScore, 5) * 10 // Quality Score 1-10 arası, default 5
  };

  // Ağırlıklı ortalama hesaplama
  return Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (scores[key as keyof typeof scores] * weight);
  }, 0);
};

// Segment performans analizi
export const analyzeSegmentPerformance = (metrics: Campaign['metrics']) => {
  const segments = {
    acquisition: {
      score: safePercentage(metrics.clicks, metrics.impressions),
      metrics: {
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        reach: metrics.reach
      }
    },
    engagement: {
      score: safePercentage(metrics.pageEngagement, metrics.clicks),
      metrics: {
        engagementRate: metrics.engagementRate,
        frequency: metrics.frequency,
        uniqueClickRate: safePercentage(metrics.uniqueClicks, metrics.clicks)
      }
    },
    conversion: {
      score: safePercentage(metrics.conversions, metrics.clicks),
      metrics: {
        conversionRate: safePercentage(metrics.conversions, metrics.clicks),
        costPerConversion: safeDiv(metrics.spend, metrics.conversions),
        roas: metrics.roas
      }
    },
    quality: {
      score: safeNumber(metrics.qualityScore, 5) * 10,
      metrics: {
        qualityScore: metrics.qualityScore,
        adRelevanceScore: metrics.adRelevanceScore,
        landingPageScore: metrics.landingPageScore
      }
    }
  };

  return {
    segments,
    overallScore: Object.values(segments).reduce((sum, segment) => sum + segment.score, 0) / 4
  };
}; 