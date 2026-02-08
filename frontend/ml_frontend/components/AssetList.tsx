import React, { useState } from 'react';
import { Search, Filter, AlertOctagon } from 'lucide-react';
import { AnalysisResult } from '@/types';

interface AssetListProps {
    data: AnalysisResult[];
    selectedId: string | null;
    onSelect: (result: AnalysisResult) => void;
}

export function AssetList({ data, selectedId, onSelect }: AssetListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredData = data.filter(item =>
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2 text-zinc-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search Machine ID or Type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                        />
                    </div>
                    <button className="px-3 py-1.5 bg-white border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-50">
                        <Filter size={14} />
                    </button>
                </div>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto">
                {filteredData.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-xs">
                        {searchQuery ? 'No machines match your search' : 'No data available'}
                    </div>
                ) : (
                    filteredData.map((row) => (
                        <div
                            key={row.id}
                            onClick={() => onSelect(row)}
                            className={`p-3 border-b border-zinc-100 cursor-pointer group transition-all ${selectedId === row.id
                                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                    : 'hover:bg-zinc-50 border-l-4 border-l-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span
                                    className={`text-xs font-bold font-mono ${selectedId === row.id ? 'text-blue-700' : 'text-zinc-900'
                                        }`}
                                >
                                    {row.id}{' '}
                                    <span className="text-zinc-400 font-normal">({row.type})</span>
                                </span>
                                {row.prediction.failure === 1 && (
                                    <AlertOctagon size={14} className="text-rose-500" />
                                )}
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                <span>RPM: {row.Rotational_speed}</span>
                                <span>Temp: {row.Air_temperature.toFixed(1)}K</span>
                                {row.prediction.failure === 1 && (
                                    <span className="text-rose-600 font-bold">FAILURE</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
