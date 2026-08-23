import React from 'react';
import type{ LucideIcon } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  className,
}) => {
  return (
    <div className={cn("bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-all duration-300 card-hover", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-secondary-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-secondary-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-secondary-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-lg bg-opacity-10 flex-shrink-0", `bg-${color}-500/10`)}>
          <Icon className={cn("w-6 h-6", `text-${color}-500`)} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;