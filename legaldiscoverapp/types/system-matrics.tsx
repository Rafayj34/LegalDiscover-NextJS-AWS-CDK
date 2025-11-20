
export interface MetricsItem {
  value: string;
  label: string;
  color: string;
}

export interface CaseDistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface RevenueTrendItem {
  month: string;
  amount: string;
  percentage: number;
}