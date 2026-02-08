import React from 'react';
import { BarChart3 } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    icon
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8">
            {icon || <BarChart3 size={48} className="mb-4 opacity-20" />}
            <p className="text-sm font-bold text-center">{title}</p>
            <p className="text-xs text-center mt-1">{description}</p>
        </div>
    );
}
