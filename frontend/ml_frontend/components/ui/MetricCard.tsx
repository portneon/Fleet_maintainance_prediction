import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MetricStatus } from '@/types';

interface MetricCardProps {
    label: string;
    value: number | string;
    unit?: string;
    icon?: LucideIcon;
    status?: MetricStatus;
}

export function MetricCard({
    label,
    value,
    unit,
    icon: Icon,
    status = 'neutral'
}: MetricCardProps) {
    const colors: Record<MetricStatus, string> = {
        neutral: "text-zinc-900",
        danger: "text-rose-600",
        warning: "text-amber-600",
        success: "text-emerald-600",
    };

    return (
        <div className="bg-zinc-50 border border-zinc-200 p-3 flex items-center justify-between rounded">
            <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                    {Icon && <Icon size={10} />} {label}
                </div>
                <div className={`text-lg font-mono font-medium mt-1 ${colors[status]}`}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                    {unit && <span className="text-xs text-zinc-500 ml-1">{unit}</span>}
                </div>
            </div>
        </div>
    );
}
