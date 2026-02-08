import React from 'react';
import { FailureMode } from '@/types';

interface FailureBadgeProps {
    mode: FailureMode;
    probability?: number;
}

export function FailureBadge({ mode, probability }: FailureBadgeProps) {
    const config: Record<FailureMode, { label: string; color: string }> = {
        TWF: {
            label: 'TOOL WEAR FAILURE',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        },
        HDF: {
            label: 'HEAT DISSIPATION',
            color: 'bg-rose-100 text-rose-800 border-rose-200'
        },
        PWF: {
            label: 'POWER FAILURE',
            color: 'bg-purple-100 text-purple-800 border-purple-200'
        },
        OSF: {
            label: 'OVERSTRAIN',
            color: 'bg-orange-100 text-orange-800 border-orange-200'
        },
        RNF: {
            label: 'RANDOM FAILURE',
            color: 'bg-zinc-200 text-zinc-800 border-zinc-300'
        },
    };

    const style = config[mode];

    return (
        <span className={`px-2 py-1 text-[10px] font-bold border rounded ${style.color} inline-flex items-center gap-1`}>
            {style.label} ({mode})
            {probability !== undefined && (
                <span className="ml-1 opacity-75">
                    {(probability * 100).toFixed(1)}%
                </span>
            )}
        </span>
    );
}
