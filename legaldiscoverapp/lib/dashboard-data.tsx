import { MetricData } from "@/types/dashboatd";
import { DollarSign, FileText, LineChart, Users } from "lucide-react";

export const metricData: MetricData[] = [
    {
        icon: FileText,
        title: "Active Cases",
        value: "24",
        changeValue: "+12%",
    },
    {
        icon: Users,
        title: "Total Clients",
        value: "156",
        changeValue: "+8%",
    },
    {
        icon: DollarSign,
        title: "Revenue (MTD)",
        value: "$48,250",
        changeValue: "+15%",
    },
    {
        icon: LineChart,
        title: "Success Rate",
        value: "94%",
        changeValue: "+2%",
    },
];