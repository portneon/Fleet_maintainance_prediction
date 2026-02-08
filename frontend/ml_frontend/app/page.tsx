'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { UploadForm } from '@/components/UploadForm';
import { AssetList } from '@/components/AssetList';
import { DiagnosticReport } from '@/components/DiagnosticReport';
import { EmptyState } from '@/components/ui/EmptyState';
import { parseCSVFile } from '@/lib/csvParser';
import { batchPredict, predictMachineFailure } from '@/lib/api';
import { calculateMachineType } from '@/lib/machineTypeCalculator';
import { AnalysisResult, MachineInput, MachineData, MachineInputForm } from '@/types';
import { BarChart3, Loader2 } from 'lucide-react';
import { downloadCSV, downloadJSON } from '@/lib/downloadUtils';

export default function PredictiveMaintenance() {
  const [vehicleName, setVehicleName] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFormSubmit = async (
    vehicleName: string,
    model: string,
    file: File
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);
    setVehicleName(vehicleName);
    setModel(model);

    try {
      // Step 1: Parse CSV file
      const machineData = await parseCSVFile(file);

      // Step 2: Send to backend for predictions
      const results = await batchPredict(machineData, (current, total) => {
        setProgress({ current, total });
      });

      // Step 3: Set results and auto-select first failure or first item
      setAnalysisResults(results);
      const firstFailure = results.find(r => r.prediction.failure === 1);
      setSelectedResult(firstFailure || results[0] || null);

      setError(null);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during analysis'
      );
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleManualSubmit = async (
    vehicleName: string,
    model: string,
    data: MachineInputForm
  ) => {
    setIsLoading(true);
    setError(null);
    setVehicleName(vehicleName);
    setModel(model);

    try {
      // Calculate machine type from age and kilometers
      const machineTypeResult = calculateMachineType(data.machine_age, data.total_kilometers);
      const { type, Type_L, Type_M } = machineTypeResult;

      // Create machine input for API (with calculated Type_L and Type_M)
      const apiInput: MachineInput = {
        Air_temperature: data.Air_temperature,
        Process_temperature: data.Process_temperature,
        Rotational_speed: data.Rotational_speed,
        Torque: data.Torque,
        Tool_wear: data.Tool_wear,
        Type_L,
        Type_M
      };

      // Create machine data object for display
      const machineData: MachineData = {
        id: `MANUAL-${Date.now()}`,
        type,
        ...apiInput
      };

      // Send to backend for prediction with vehicle metadata for Groq report
      const prediction = await predictMachineFailure(apiInput, {
        vehicle_name: vehicleName,
        model: model,
        machine_age: data.machine_age,
        total_kilometers: data.total_kilometers
      });

      // Create result
      const result: AnalysisResult = {
        ...machineData,
        prediction
      };

      // Set results
      setAnalysisResults([result]);
      setSelectedResult(result);
      setError(null);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during prediction'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = (format: 'csv' | 'json') => {
    const filename = `${vehicleName || 'fleet'}_${model || 'analysis'}_results`.replace(/\s+/g, '_');
    if (format === 'csv') {
      downloadCSV(analysisResults, `${filename}.csv`);
    } else {
      downloadJSON(analysisResults, `${filename}.json`);
    }
  };

  const criticalCount = analysisResults.filter(r => r.prediction.failure === 1).length;
  const hasData = analysisResults.length > 0;

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-zinc-900 font-sans flex flex-col overflow-hidden">

      {/* Header */}
      <Header criticalCount={criticalCount} hasData={hasData} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel: Upload Form or Asset List */}
        <div className="w-105 bg-white border-r border-zinc-200 flex flex-col z-10">

          {!hasData ? (
            <UploadForm
              onSubmit={handleFormSubmit}
              onManualSubmit={handleManualSubmit}
              isLoading={isLoading}
            />
          ) : (
            <>
              {/* Vehicle Info Header */}
              <div className="p-4 border-b border-zinc-200 bg-blue-50">
                <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">
                  Active Analysis
                </div>
                <div className="text-sm font-bold text-zinc-900">{vehicleName}</div>
                <div className="text-xs text-zinc-600">Model: {model}</div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  {analysisResults.length} machine{analysisResults.length !== 1 ? 's' : ''} analyzed
                </div>

                {/* Download All Buttons */}
                {analysisResults.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDownloadAll('csv')}
                      className="flex-1 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold rounded hover:bg-zinc-800 transition-colors"
                    >
                      Download All CSV
                    </button>
                    <button
                      onClick={() => handleDownloadAll('json')}
                      className="flex-1 px-3 py-1.5 bg-zinc-700 text-white text-[10px] font-bold rounded hover:bg-zinc-600 transition-colors"
                    >
                      Download All JSON
                    </button>
                  </div>
                )}

                {/* New Analysis Button */}
                <button
                  onClick={() => {
                    setAnalysisResults([]);
                    setSelectedResult(null);
                    setVehicleName('');
                    setModel('');
                  }}
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-zinc-300 text-zinc-700 text-[10px] font-bold rounded hover:bg-zinc-50 transition-colors"
                >
                  New Analysis
                </button>
              </div>

              {analysisResults.length > 1 ? (
                <AssetList
                  data={analysisResults}
                  selectedId={selectedResult?.id || null}
                  onSelect={setSelectedResult}
                />
              ) : (
                <div className="flex-1 p-4 text-center text-xs text-zinc-500">
                  Single machine analysis complete. View results on the right.
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 border-t border-zinc-200 bg-blue-50">
              <div className="flex items-center gap-2 text-blue-700">
                <Loader2 className="animate-spin" size={16} />
                <div className="text-xs font-bold">
                  {progress
                    ? `Processing ${progress.current} of ${progress.total} machines...`
                    : 'Analyzing data...'}
                </div>
              </div>
              {progress && (
                <div className="mt-2 w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 border-t border-rose-200 bg-rose-50">
              <div className="text-xs font-bold text-rose-700 mb-1">Error</div>
              <div className="text-[10px] text-rose-600">{error}</div>
            </div>
          )}
        </div>

        {/* Right Panel: Diagnostic Report or Empty State */}
        <div className="flex-1 bg-zinc-100/50 p-6 overflow-y-auto flex flex-col items-center">
          {selectedResult ? (
            <DiagnosticReport data={selectedResult} />
          ) : (
            <EmptyState
              title={hasData ? 'Select a Machine to Analyze' : 'Upload Data to Begin'}
              description={hasData ? 'Click on a machine from the list' : 'Choose CSV upload or manual entry to get started'}
              icon={<BarChart3 size={48} className="mb-4 opacity-20" />}
            />
          )}
        </div>

      </div>
    </div>
  );
}