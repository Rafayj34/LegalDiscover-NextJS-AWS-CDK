import React from "react";
import { ActivityIcon, BarChart3, ChartPie } from "lucide-react";
import { CaseDistributionItem, MetricsItem, RevenueTrendItem } from "@/types/system-matrics";
import { caseDistributionData, revenueTrendData, systemMetricsData } from "@/lib/system-metrics";

const MetricCard: React.FC<MetricsItem> = ({ value, label, color }) => (
  <div className="flex flex-col items-center">
    <span className={`text-3xl font-bold ${color}`}>{value}</span>
    <span className="text-sm text-gray-600 mt-1">{label}</span>
  </div>
);

const ProgressBar: React.FC<CaseDistributionItem> = ({
  label,
  count,
  percentage,
}) => (
  <div className="flex items-center">
    <span className="text-sm font-medium text-gray-700 w-32">{label}</span>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-[70%]">
      <div
        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
    <span className="text-sm font-bold text-gray-900 w-12 text-right">{count}</span>
  </div>
);

const DataBarChartItem: React.FC<RevenueTrendItem> = ({
  month,
  amount,
  percentage,
}) => (
  <div className="flex items-center space-x-3">
    <span className="text-sm font-medium text-gray-700 w-12">{month}</span>
    <div className="flex-1 bg-gray-200 rounded h-6 relative">
      <div
        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded"
        style={{ width: `${percentage}%` }}
      />
    </div>

    <span className="text-sm font-bold text-gray-900 w-20 text-right">
      {amount}
    </span>
  </div>
);

interface SystemMetricsOverviewProps {
  metrics: MetricsItem[];
}

const SystemMetricsOverview: React.FC<SystemMetricsOverviewProps> = ({
  metrics,
}) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-light-gray">
    <div className="flex items-center justify-between mb-[24px]">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        <ActivityIcon className="h-5 w-5 text-blue-600 mr-2" />
        Live System Metrics
      </h2>

      <div className="flex items-center text-sm text-green-600">
        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
        All Systems Operational
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  </div>
);

interface CaseDistributionCardProps {
  distribution: CaseDistributionItem[];
}

const CaseDistributionCard: React.FC<CaseDistributionCardProps> = ({
  distribution,
}) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-light-gray w-full flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">Case Distribution</h2>
      <ChartPie className="h-5 w-5 text-gray-400 cursor-pointer" />
    </div>

    <div className="space-y-4">
      {distribution.map((item, index) => (
        <ProgressBar key={index} {...item} />
      ))}
    </div>
  </div>
);

interface RevenueTrendCardProps {
  trendData: RevenueTrendItem[];
}

const RevenueTrendCard: React.FC<RevenueTrendCardProps> = ({
  trendData,
}) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-light-gray w-full flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
      <BarChart3 className="h-5 w-5 text-gray-400 cursor-pointer" />
    </div>

    <div className="space-y-4">
      {trendData.map((item, index) => (
        <DataBarChartItem key={index} {...item} />
      ))}
    </div>
  </div>
);

interface LiveSystemMetricsProps {
  metrics?: MetricsItem[];
  caseDistribution?: CaseDistributionItem[];
  revenueTrend?: RevenueTrendItem[];
}

export const LiveSystemMetrics: React.FC<LiveSystemMetricsProps> = ({
  metrics = systemMetricsData,
  caseDistribution = caseDistributionData,
  revenueTrend = revenueTrendData,
}) => (
  <div className="flex flex-col gap-[10px]">
    <SystemMetricsOverview metrics={metrics} />

    <div className="flex flex-col md:flex-row gap-[10px]">
      <CaseDistributionCard distribution={caseDistribution} />
      <RevenueTrendCard trendData={revenueTrend} />
    </div>
  </div>
);
