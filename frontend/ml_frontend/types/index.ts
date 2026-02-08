// Type definitions for the predictive maintenance application

export interface MachineInput {
    Air_temperature: number;
    Process_temperature: number;
    Rotational_speed: number;
    Torque: number;
    Tool_wear: number;
    Type_L: boolean;
    Type_M: boolean;
}

export interface MachineInputForm {
    Air_temperature: number;
    Process_temperature: number;
    Rotational_speed: number;
    Torque: number;
    Tool_wear: number;
    machine_age: number; // in years
    total_kilometers: number; // total km traveled
}

export interface PredictionResult {
    failure: 0 | 1;
    failure_probability: number;
    failure_types: {
        [key: string]: number;
    } | null;
    maintenance_report?: MaintenanceReport; // Optional Groq AI generated report
}

export interface MaintenanceReport {
    report?: string; // Full AI-generated maintenance report
    summary?: string; // Brief summary if Groq unavailable
    status: string; // E.g., "CRITICAL - Failure Detected" or "Operational"
    groq_available: boolean; // Whether Groq AI was used
    vehicle_info?: {
        name: string;
        model: string;
        type: string;
        quality: string;
        age_years: number;
        total_km: number;
    };
    message?: string; // Info/error messages
    error?: string; // Error details if applicable
}

export interface MachineData extends MachineInput {
    id: string;
    type: string; // 'M' or 'L' - for display purposes
}

export interface AnalysisResult extends MachineData {
    prediction: PredictionResult;
}

export interface FormData {
    vehicleName: string;
    model: string;
    csvFile: File | null;
}

export type FailureMode = 'TWF' | 'HDF' | 'PWF' | 'OSF' | 'RNF';

export type MetricStatus = 'neutral' | 'danger' | 'warning' | 'success';
