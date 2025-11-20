import React from "react";
import { ActivityIcon, BarChart3, ChartPie } from "lucide-react";
import { CaseDistributionItem, MetricsItem, RevenueTrendItem } from "@/types/system-matrics";
import { caseDistributionData, revenueTrendData, systemMetricsData } from "@/lib/system-metrics";

const MetricCard: React.FC<MetricsItem> = ({ value, label, color }) => (
  <div className="flex flex-col items-center">
    <span className={`text-4xl font-bold mb-1 ${color}`}>{value}</span>
    <span className="text-gray-500 text-sm">{label}</span>
  </div>
);

const ProgressBar: React.FC<CaseDistributionItem> = ({
  label,
  count,
  percentage,
}) => (
  <div className="text-sm">
    <div className="flex justify-between items-center mb-1">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-gray-800">{count}</span>
    </div>

    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-blue-600"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const DataBarChartItem: React.FC<RevenueTrendItem> = ({
  month,
  amount,
  percentage,
}) => (
  <div className="flex items-center space-x-3">
    <span className="w-10 text-sm text-gray-500">{month}</span>

    <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
      <div
        className="h-3 rounded-full bg-green-500"
        style={{ width: `${percentage}%` }}
      />
    </div>

    <span className="w-10 text-sm font-medium text-gray-800 text-right">
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
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        <ActivityIcon className="h-5 w-5 text-blue-600 mr-2" />
        Live System Metrics
      </h2>

      <div className="flex items-center text-green-600 font-medium">
        <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
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
      <h2 className="text-xl font-semibold text-gray-800">Case Distribution</h2>
      <ChartPie className="text-gray-400 cursor-pointer" />
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
      <h2 className="text-xl font-semibold text-gray-800">Revenue Trend</h2>
      <BarChart3 className="h-6 w-6 text-gray-400 cursor-pointer" />
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
