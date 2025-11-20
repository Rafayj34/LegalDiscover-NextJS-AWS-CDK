import { CaseDistributionItem,  MetricsItem,  RevenueTrendItem } from "@/types/system-matrics";

export const systemMetricsData: MetricsItem[] = [
    { value: "52", label: "Active Users", color: "text-blue-600" },
    { value: "1519", label: "API Calls Today", color: "text-indigo-600" },
    { value: "102ms", label: "Avg Response Time", color: "text-green-600" },
    { value: "99.96%", label: "System Uptime", color: "text-purple-600" },
];

export const caseDistributionData: CaseDistributionItem[] = [
    { label: "Personal Injury", count: 8, percentage: 80 },
    { label: "Corporate Law", count: 6, percentage: 60 },
    { label: "Family Law", count: 5, percentage: 50 },
    { label: "Criminal Defense", count: 3, percentage: 30 },
    { label: "Real Estate", count: 2, percentage: 20 },
];

export const revenueTrendData: RevenueTrendItem[] = [
    { month: "Jan", amount: "$42k", percentage: 70 },
    { month: "Feb", amount: "$45k", percentage: 75 },
    { month: "Mar", amount: "$48k", percentage: 80 },
    { month: "Apr", amount: "$51k", percentage: 85 },
    { month: "May", amount: "$48k", percentage: 80 },
    { month: "Jun", amount: "$52k", percentage: 87 },
];
