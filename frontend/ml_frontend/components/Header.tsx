import React from 'react';

interface HeaderProps {
    criticalCount: number;
    hasData: boolean;
}

export function Header({ criticalCount, hasData }: HeaderProps) {
    return (
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center rounded font-bold">
                    AI
                </div>
                <div>
                    <h1 className="text-sm font-bold text-zinc-900">PREDICTIVE MAINTENANCE</h1>
                    <div className="text-[10px] font-mono text-zinc-500">MODEL: AI4I-2020-V2</div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {hasData && criticalCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-rose-700">
                            {criticalCount} CRITICAL FAILURE{criticalCount !== 1 ? 'S' : ''} DETECTED
                        </span>
                    </div>
                )}
                {hasData && (
                    <>
                        <div className="h-6 w-[1px] bg-zinc-200" />
                        <div className="text-[10px] font-mono text-zinc-400">
                            SESSION ID: #{Math.floor(Math.random() * 100000)}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
