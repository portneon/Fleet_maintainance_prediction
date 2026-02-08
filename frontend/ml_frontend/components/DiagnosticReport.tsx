import React from 'react';
import {
    Activity,
    AlertOctagon,
    CheckCircle2,
    RotateCw,
    Zap,
    Thermometer,
    AlertTriangle,
    Download
} from 'lucide-react';
import { AnalysisResult, FailureMode } from '@/types';
import { MetricCard } from '@/components/ui/MetricCard';
import { FailureBadge } from '@/components/ui/FailureBadge';
import { MaintenanceReport } from '@/components/MaintenanceReport';
import { downloadSingleResult } from '@/lib/downloadUtils';

interface DiagnosticReportProps {
    data: AnalysisResult;
}

export function DiagnosticReport({ data }: DiagnosticReportProps) {
    const isFailed = data.prediction.failure === 1;
    const failureModes = data.prediction.failure_types
        ? Object.entries(data.prediction.failure_types)
        : [];

    const handleDownload = (format: 'csv' | 'json') => {
        downloadSingleResult(data, format);
    };

    const getFailureDiagnostics = (mode: string): string => {
        const diagnostics: Record<string, string> = {
            TWF: `Tool Wear threshold exceeded (${data.Tool_wear} min). Tool replacement imminent.`,
            HDF: `Process temp (${data.Process_temperature.toFixed(1)}K) exceeds safe delta from ambient. Check coolant system.`,
            PWF: 'Inconsistent Torque/RPM ratio detected. Check power supply unit.',
            OSF: `Torque load (${data.Torque.toFixed(1)}Nm) exceeded maximum design capacity for Type ${data.type}.`
        };
        return diagnostics[mode] || 'Unknown failure mode detected.';
    };

    return (
        <div className="w-full max-w-4xl space-y-4">
            {/* Main Diagnostic Report */}
            <div className="bg-white border border-zinc-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
                {/* Report Header */}
                <div className="p-6 border-b border-zinc-200 flex justify-between items-start bg-zinc-50/30">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-black text-zinc-900">{data.id}</h2>
                            <span
                                className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase ${data.type === 'H'
                                    ? 'bg-zinc-800 text-white border-zinc-900'
                                    : data.type === 'M'
                                        ? 'bg-zinc-200 text-zinc-800 border-zinc-300'
                                        : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                    }`}
                            >
                                Type {data.type} Asset
                            </span>
                        </div>
                        <div className="text-xs font-mono text-zinc-500">MACHINE ID: {data.id}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div>
                            {isFailed ? (
                                <div className="flex items-center gap-2 text-rose-600">
                                    <AlertOctagon size={24} />
                                    <div className="text-left">
                                        <div className="text-sm font-black">FAILURE DETECTED</div>
                                        <div className="text-[10px] font-bold opacity-80">
                                            IMMEDIATE ACTION REQUIRED
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 size={24} />
                                    <div className="text-left">
                                        <div className="text-sm font-black">OPERATIONAL</div>
                                        <div className="text-[10px] font-bold opacity-80">
                                            OPTIMAL PERFORMANCE
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Download Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDownload('json')}
                                className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded hover:bg-zinc-800 transition-colors flex items-center gap-1"
                            >
                                <Download size={12} />
                                JSON
                            </button>
                            <button
                                onClick={() => handleDownload('csv')}
                                className="px-3 py-1 bg-zinc-700 text-white text-[10px] font-bold rounded hover:bg-zinc-600 transition-colors flex items-center gap-1"
                            >
                                <Download size={12} />
                                CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Probability Bar */}
                <div className="p-4 bg-zinc-50 border-b border-zinc-200">
                    <div className="flex justify-between items-end mb-1">
                        <div className="text-xs font-bold text-zinc-500 uppercase">
                            Failure Probability
                        </div>
                        <div className="text-sm font-mono font-bold text-zinc-900">
                            {(data.prediction.failure_probability * 100).toFixed(2)}%
                        </div>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${data.prediction.failure_probability > 0.5
                                ? 'bg-rose-500'
                                : data.prediction.failure_probability > 0.3
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                            style={{ width: `${data.prediction.failure_probability * 100}%` }}
                        />
                    </div>
                </div>

                {/* Telemetry Grid */}
                <div className="p-6 grid grid-cols-4 gap-4 bg-white">
                    <div className="col-span-4 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} /> Sensor Telemetry
                    </div>

                    <MetricCard
                        label="Rotational Speed"
                        value={data.Rotational_speed}
                        unit="RPM"
                        icon={RotateCw}
                    />
                    <MetricCard
                        label="Torque"
                        value={data.Torque}
                        unit="Nm"
                        icon={Zap}
                    />
                    <MetricCard
                        label="Air Temp"
                        value={data.Air_temperature}
                        unit="K"
                        icon={Thermometer}
                    />
                    <MetricCard
                        label="Process Temp"
                        value={data.Process_temperature}
                        unit="K"
                        icon={Thermometer}
                        status={data.Process_temperature > 310 ? 'warning' : 'neutral'}
                    />
                </div>

                {/* Tool Wear Progress */}
                <div className="p-6 border-t border-zinc-200 bg-zinc-50">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-xs font-bold text-zinc-500 uppercase">
                            Tool Wear Accumulation
                        </div>
                        <div className="text-xs font-mono font-bold text-zinc-900">
                            {data.Tool_wear} min
                        </div>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${data.Tool_wear > 200 ? 'bg-rose-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((data.Tool_wear / 250) * 100, 100)}%` }}
                        />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>0 min</span>
                        <span>THRESHOLD: 200 min</span>
                    </div>
                </div>

                {/* Failure Analysis Section */}
                {isFailed && failureModes.length > 0 && (
                    <div className="p-6 border-t border-zinc-200 bg-rose-50/30">
                        <div className="mb-4 text-xs font-bold text-rose-700 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle size={14} /> Root Cause Analysis
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {failureModes.map(([mode, probability]) => (
                                <FailureBadge
                                    key={mode}
                                    mode={mode as FailureMode}
                                    probability={probability}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-bold text-zinc-900 mb-2">
                                    Automated Diagnostics
                                </h4>
                                <ul className="text-xs text-zinc-600 space-y-2 list-disc pl-4">
                                    {failureModes.map(([mode]) => (
                                        <li key={mode}>
                                            <strong className="text-zinc-900">{mode}:</strong>{' '}
                                            {getFailureDiagnostics(mode)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-zinc-900 mb-2">
                                    Recommended Actions
                                </h4>
                                <div className="bg-white border border-zinc-200 p-3 rounded text-xs text-zinc-700 shadow-sm">
                                    1. Halt machine operation immediately.
                                    <br />
                                    2. Inspect affected components based on failure types.
                                    <br />
                                    3. Log incident in predictive model for retraining.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI-Powered Maintenance Report (if available) */}
            {data.prediction.maintenance_report && (
                <MaintenanceReport 
                    report={data.prediction.maintenance_report}
                    machineId={data.id}
                />
            )}
        </div>
    );
}
