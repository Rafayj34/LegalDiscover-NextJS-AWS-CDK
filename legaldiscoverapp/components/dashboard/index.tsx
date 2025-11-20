"use client";

import React from 'react';
import { Button } from '../ui/button';
import { metricData } from '@/lib/dashboard-data';
import { MetricCardProps } from '@/types/dashboatd';
import { ArrowUp, RefreshCw, Download } from 'lucide-react';

const MetricCard: React.FC<MetricCardProps> = ({
    accentColor,
    icon: Icon,
    title,
    value,
    changeValue,
}) => {
    const changeColor = 'text-green-500';

    return (
        <div className="bg-white rounded-xl shadow-xl border border-light-gray overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className={`h-2 ${accentColor}`}></div>

            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl flex items-center justify-center ${accentColor}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowUp className={`w-5 h-5 ${changeColor}`} />
                </div>
                <div className="pt-2 space-y-1">
                    <h3 className="text-base font-medium text-cool-gray">{title}</h3>
                    <p className="text-4xl font-extrabold text-gray-900">{value}</p>
                </div>

                <p className={`text-sm font-medium ${changeColor}`}>
                    {changeValue} from last month
                </p>
            </div>
        </div>
    );
};

export const Dashboard = () => {
    return (
        <div className="p-4 sm:p-8 space-y-8 bg-gray-50 h-[91vh] overflow-y-scroll">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="bg-white flex justify-between w-full p-6 shadow-md">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-4 md:mb-0">
                            Welcome back, Dev!
                            <span className="text-4xl ml-2">👋</span>
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Here's your legal practice overview for today:
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center"
                        >
                            This Month
                        </Button>
                        <RefreshCw className="cursor-pointer w-5 h-5 mr-2" />
                        <Button
                            className="bg-accent text-white hover:bg-indigo-700 shadow-indigo-500/50 flex items-center"
                        >
                            <Download />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricData.map((metric, index) => (
                    <MetricCard
                        key={index}
                        accentColor={index === 0 ? "bg-accent" : index === 1 ? "bg-indigo-600" : index === 2 ? "bg-green-500" : "bg-purple-600"}
                        icon={metric.icon}
                        title={metric.title}
                        value={metric.value}
                        changeValue={metric.changeValue}
                    />
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-light-gray min-h-[300px] mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Live System Metrics
                </h2>
                <p className="text-cool-gray">Detailed logs for recent case updates will appear here.</p>
            </div>

        </div>
    );
};
