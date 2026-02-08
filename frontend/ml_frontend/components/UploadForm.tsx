import React, { useState } from 'react';
import { UploadCloud, Edit3 } from 'lucide-react';
import { validateCSVFile } from '@/lib/csvParser';
import { MachineInputForm } from '@/types';

type InputMode = 'csv' | 'manual';

interface UploadFormProps {
    onSubmit: (vehicleName: string, model: string, file: File) => void;
    onManualSubmit: (vehicleName: string, model: string, data: MachineInputForm) => void;
    isLoading: boolean;
}

export function UploadForm({ onSubmit, onManualSubmit, isLoading }: UploadFormProps) {
    const [mode, setMode] = useState<InputMode>('csv');
    const [vehicleName, setVehicleName] = useState('');
    const [model, setModel] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Manual entry fields - start with empty values
    const [manualData, setManualData] = useState<MachineInputForm>({
        Air_temperature: 0,
        Process_temperature: 0,
        Rotational_speed: 0,
        Torque: 0,
        Tool_wear: 0,
        machine_age: 0,
        total_kilometers: 0,
    });

    const [errors, setErrors] = useState<{
        vehicleName?: string;
        model?: string;
        file?: string;
        manual?: string;
    }>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            const fileError = validateCSVFile(selectedFile);
            setErrors(prev => ({ ...prev, file: fileError || undefined }));
        }
    };

    const handleManualChange = (field: keyof MachineInputForm, value: number) => {
        setManualData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate common fields
        const newErrors: typeof errors = {};

        if (!vehicleName.trim()) {
            newErrors.vehicleName = 'Vehicle name is required';
        }

        if (!model.trim()) {
            newErrors.model = 'Model is required';
        }

        // Mode-specific validation
        if (mode === 'csv') {
            if (!file) {
                newErrors.file = 'Please select a CSV file';
            } else {
                const fileError = validateCSVFile(file);
                if (fileError) {
                    newErrors.file = fileError;
                }
            }
        } else {
            // Validate manual data
            if (manualData.Air_temperature < 0) {
                newErrors.manual = 'Air temperature must be positive';
            }
            if (manualData.Process_temperature < 0) {
                newErrors.manual = 'Process temperature must be positive';
            }
            if (manualData.Rotational_speed <= 0) {
                newErrors.manual = 'Rotational speed must be greater than 0';
            }
            if (manualData.Torque < 0) {
                newErrors.manual = 'Torque must be positive';
            }
            if (manualData.Tool_wear < 0) {
                newErrors.manual = 'Tool wear must be positive';
            }
            if (manualData.machine_age < 0) {
                newErrors.manual = 'Machine age must be positive';
            }
            if (manualData.total_kilometers < 0) {
                newErrors.manual = 'Total kilometers must be positive';
            }
        }

        setErrors(newErrors);

        // If no errors, submit
        if (Object.keys(newErrors).length === 0) {
            if (mode === 'csv' && file) {
                onSubmit(vehicleName, model, file);
            } else if (mode === 'manual') {
                onManualSubmit(vehicleName, model, manualData);
            }
        }
    };

    return (
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
            <form onSubmit={handleSubmit} className="space-y-3">

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setMode('csv')}
                        className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'csv'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                        disabled={isLoading}
                    >
                        <UploadCloud size={14} />
                        Upload CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'manual'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                        disabled={isLoading}
                    >
                        <Edit3 size={14} />
                        Manual Entry
                    </button>
                </div>

                {/* Common Fields */}
                <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Vehicle Name
                    </label>
                    <input
                        type="text"
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        className={`w-full px-3 py-2 bg-white border rounded text-xs outline-none focus:border-blue-500 ${errors.vehicleName ? 'border-rose-500' : 'border-zinc-200'
                            }`}
                        placeholder="e.g., Fleet Alpha"
                        disabled={isLoading}
                    />
                    {errors.vehicleName && (
                        <p className="text-[10px] text-rose-600 mt-1">{errors.vehicleName}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Model
                    </label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className={`w-full px-3 py-2 bg-white border rounded text-xs outline-none focus:border-blue-500 ${errors.model ? 'border-rose-500' : 'border-zinc-200'
                            }`}
                        placeholder="e.g., Industrial XR-500"
                        disabled={isLoading}
                    />
                    {errors.model && (
                        <p className="text-[10px] text-rose-600 mt-1">{errors.model}</p>
                    )}
                </div>

                {/* CSV Mode */}
                {mode === 'csv' && (
                    <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                            CSV Data File
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="csv-upload"
                                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${errors.file
                                    ? 'border-rose-300 bg-rose-50'
                                    : 'border-zinc-300 hover:bg-blue-50 hover:border-blue-400'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'group'}`}
                            >
                                <UploadCloud className={`mb-2 ${errors.file ? 'text-rose-400' : 'text-zinc-400 group-hover:text-blue-500'}`} size={20} />
                                <div className="text-xs font-bold text-zinc-700">
                                    {file ? file.name : 'Upload Sensor CSV'}
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Click to browse'}
                                </div>
                            </label>
                        </div>
                        {errors.file && (
                            <p className="text-[10px] text-rose-600 mt-1">{errors.file}</p>
                        )}
                        <p className="text-[9px] text-zinc-400 mt-1">
                            Required columns: Air_temperature, Process_temperature, Rotational_speed, Torque, Tool_wear, machine_age, total_kilometers
                        </p>
                    </div>
                )}

                {/* Manual Mode */}
                {mode === 'manual' && (
                    <div className="space-y-3 p-3 bg-white border border-zinc-200 rounded">
                        <div className="text-xs font-bold text-zinc-700 mb-2">Machine Parameters</div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Air Temperature (K)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualData.Air_temperature || ''}
                                    onChange={(e) => handleManualChange('Air_temperature', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 298.1"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Process Temperature (K)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualData.Process_temperature || ''}
                                    onChange={(e) => handleManualChange('Process_temperature', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 308.6"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Rotational Speed (RPM)
                                </label>
                                <input
                                    type="number"
                                    value={manualData.Rotational_speed || ''}
                                    onChange={(e) => handleManualChange('Rotational_speed', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 1551"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Torque (Nm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualData.Torque || ''}
                                    onChange={(e) => handleManualChange('Torque', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 42.8"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Tool Wear (min)
                                </label>
                                <input
                                    type="number"
                                    value={manualData.Tool_wear || ''}
                                    onChange={(e) => handleManualChange('Tool_wear', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 50"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Machine Age (years)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualData.machine_age || ''}
                                    onChange={(e) => handleManualChange('machine_age', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 2.5"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                    Total Kilometers
                                </label>
                                <input
                                    type="number"
                                    value={manualData.total_kilometers || ''}
                                    onChange={(e) => handleManualChange('total_kilometers', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 75000"
                                    className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded text-xs outline-none focus:border-blue-500"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {errors.manual && (
                            <p className="text-[10px] text-rose-600">{errors.manual}</p>
                        )}

                        <div className="text-[9px] text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-200">
                            <strong>Note:</strong> Machine type (H/M/L) will be automatically calculated based on age and kilometers
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-zinc-900 text-white py-2 px-4 rounded font-bold text-xs hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Processing...' : mode === 'csv' ? 'Analyze Data' : 'Predict Failure'}
                </button>
            </form>
        </div>
    );
}
