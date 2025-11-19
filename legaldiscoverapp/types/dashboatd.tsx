import React from "react";

export interface MetricData {
    icon: React.ElementType;
    title: string;
    value: string;
    changeValue: string;
}

export interface MetricType {
  accentColor: string;
  icon: React.ElementType;
  title: string;
  value: string;
  changeValue: string;
}

export interface MetricCardProps extends Omit<MetricType, "id"> {}
