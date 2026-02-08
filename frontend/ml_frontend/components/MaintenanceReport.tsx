import React, { useState } from 'react';
import { MaintenanceReport as MaintenanceReportType } from '@/types';
import { AlertTriangle, CheckCircle2, FileText, Wrench, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { downloadMaintenanceReportPDF } from '@/lib/downloadUtils';

interface MaintenanceReportProps {
    report: MaintenanceReportType;
    machineId?: string;
}

export function MaintenanceReport({ report, machineId = 'Machine' }: MaintenanceReportProps) {
    const { report: fullReport, summary, status, groq_available, vehicle_info, message } = report;
    const [isDownloading, setIsDownloading] = useState(false);

    // Enhanced markdown renderer for bold, headers, and line breaks
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, lineIndex) => {
            // Check for ### headers
            if (line.trim().startsWith('###')) {
                const headerText = line.replace(/^###\s*/, '');
                return (
                    <h4 key={lineIndex} className="font-bold text-lg text-zinc-900 mt-4 mb-2">
                        {renderInlineBold(headerText)}
                    </h4>
                );
            }

            // Regular line with bold support
            return (
                <div key={lineIndex} className="mb-1">
                    {renderInlineBold(line)}
                </div>
            );
        });
    };

    // Helper to render inline bold within a line
    const renderInlineBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return <strong key={index} className="font-bold text-zinc-900">{boldText}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    // Parse the AI report into sections
    const parseReportSections = (text: string) => {
        const sections = [];
        const sectionRegex = /(?:^|\n)(?:\d+\.\s*)?(\*\*)?([A-Z][A-Za-z\s]+?)(\*\*)?:\s*\n?([\s\S]*?)(?=\n(?:\d+\.\s*)?[A-Z]|\n\n(?:\d+\.|$)|$)/g;

        let match;
        while ((match = sectionRegex.exec(text)) !== null) {
            sections.push({
                title: match[2].trim(),
                content: match[4].trim()
            });
        }

        return sections.length > 0 ? sections : [];
    };

    const reportSections = fullReport ? parseReportSections(fullReport) : [];

    // Initialize all sections as expanded (including vehicle and all report sections)
    const initialExpandedSections = new Set<string>(['vehicle']);
    reportSections.forEach((_, idx) => initialExpandedSections.add(`section-${idx}`));

    const [expandedSections, setExpandedSections] = useState<Set<string>>(initialExpandedSections);

    // Determine status icon and color
    const isCritical = status.includes('CRITICAL') || status.includes('FAILURE');
    const StatusIcon = isCritical ? AlertTriangle : CheckCircle2;
    const statusColor = isCritical ? 'text-rose-600' : 'text-emerald-600';
    const bgColor = isCritical ? 'bg-rose-50/50' : 'bg-emerald-50/50';
    const borderColor = isCritical ? 'border-rose-200' : 'border-emerald-200';

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const toggleAllSections = () => {
        if (expandedSections.size === 0) {
            // Expand all
            const allSections = new Set<string>(['vehicle']);
            reportSections.forEach((_, idx) => allSections.add(`section-${idx}`));
            setExpandedSections(allSections);
        } else {
            // Collapse all
            setExpandedSections(new Set());
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            await downloadMaintenanceReportPDF(report, machineId);
        } finally {
            setIsDownloading(false);
        }
    };

    const allExpanded = expandedSections.size > 0;

    return (
        <div className="bg-white rounded-xl border-2 border-zinc-300 overflow-hidden shadow-lg max-w-5xl mx-auto">
            {/* PDF-Style Header with Document Title */}
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <Wrench size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Maintenance Analysis Report</h2>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-zinc-300">Machine ID: {machineId}</span>
                                <span className="text-zinc-400">•</span>
                                {groq_available ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-green-300 font-medium">AI-Enhanced</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-zinc-400">Standard Analysis</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleAllSections}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20"
                        >
                            {allExpanded ? (
                                <>
                                    <ChevronUp size={14} />
                                    Collapse All
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={14} />
                                    Expand All
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Banner - Document Style */}
            <div className={`px-6 py-4 border-b-2 ${borderColor} ${bgColor}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isCritical ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                        <StatusIcon size={24} className={statusColor} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-base font-bold ${statusColor} uppercase tracking-wide`}>{status}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCritical ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'}`}>
                                {isCritical ? 'URGENT' : 'NORMAL'}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-600 mt-1 font-medium">
                            {isCritical ? '⚠️ Immediate attention required for optimal performance' : '✓ All systems operating within normal parameters'}
                        </p>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                        <div className="font-semibold text-zinc-700">{new Date().toLocaleDateString()}</div>
                        <div className="mt-0.5">{new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>

            {/* Vehicle Information - Professional Card Style */}
            {vehicle_info && (
                <div className="px-6 py-5 bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-200">
                    <button
                        onClick={() => toggleSection('vehicle')}
                        className="w-full flex items-center justify-between mb-4 group"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            <h4 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">Vehicle Information</h4>
                        </div>
                        <ChevronDown
                            size={20}
                            className={`transition-transform text-zinc-400 group-hover:text-blue-600 ${expandedSections.has('vehicle') ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {expandedSections.has('vehicle') && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Vehicle Name</div>
                                <div className="text-base text-zinc-900 font-bold">{vehicle_info.name}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Model</div>
                                <div className="text-base text-zinc-900 font-bold">{vehicle_info.model}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Quality Type</div>
                                <div className="text-base text-zinc-900 font-bold">{vehicle_info.quality}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Vehicle Age</div>
                                <div className="text-base text-zinc-900 font-bold">{vehicle_info.age_years} years</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Total Distance</div>
                                <div className="text-base text-zinc-900 font-bold">{vehicle_info.total_km.toLocaleString()} km</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Type Classification</div>
                                <div className="text-base text-zinc-900 font-bold">Type {vehicle_info.type}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI Analysis Report - Document Body */}
            <div className="px-6 py-6 bg-white">
                <div className="mb-4 pb-3 border-b-2 border-zinc-200">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-7 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-zinc-900">Detailed Analysis Report</h3>
                    </div>
                </div>

                {fullReport ? (
                    // AI-generated detailed report with professional section styling
                    <div className="space-y-4">
                        {reportSections.length > 0 ? (
                            reportSections.map((section, idx) => (
                                <div
                                    key={idx}
                                    className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent rounded-r-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                                >
                                    <button
                                        onClick={() => toggleSection(`section-${idx}`)}
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/50 transition-colors group"
                                    >
                                        <h5 className="font-bold text-base text-zinc-900 group-hover:text-blue-700 transition-colors">{section.title}</h5>
                                        <ChevronDown
                                            size={18}
                                            className={`transition-transform text-zinc-400 group-hover:text-blue-600 ${expandedSections.has(`section-${idx}`) ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {expandedSections.has(`section-${idx}`) && (
                                        <div className="px-5 py-5 bg-white text-base leading-loose text-zinc-800 border-t border-blue-200">
                                            {renderMarkdown(section.content)}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            // Fallback: show full report in a clean document style
                            <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 shadow-inner">
                                <div className="text-base leading-loose text-zinc-800">
                                    {renderMarkdown(fullReport)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : summary ? (
                    // Basic summary with nice formatting
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                        <div className="text-base text-zinc-800 leading-loose">
                            {renderMarkdown(summary)}
                        </div>
                    </div>
                ) : message ? (
                    // Info message
                    <div className="flex items-start gap-3 p-5 bg-amber-50 rounded-lg border-l-4 border-amber-400 shadow-sm">
                        <FileText size={20} className="shrink-0 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800 font-medium">{message}</div>
                    </div>
                ) : (
                    <div className="text-sm text-zinc-500 italic p-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-300 text-center">
                        No detailed report available for this analysis
                    </div>
                )}
            </div>

            {/* Footer - Document Style */}
            <div className="px-6 py-4 bg-gradient-to-r from-zinc-100 to-zinc-50 border-t-2 border-zinc-200">
                {!groq_available && (
                    <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-100 px-4 py-2.5 rounded-lg mb-3 border border-amber-300">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span className="font-medium">
                            💡 Tip: Configure GROQ_API_KEY in backend for AI-enhanced recommendations and deeper insights
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span className="font-medium">
                        Report Type: {groq_available ? 'AI-Powered Analysis' : 'Basic Analysis'}
                    </span>
                    <span className="font-mono">
                        Generated: {new Date().toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
