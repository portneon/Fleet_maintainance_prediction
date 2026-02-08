import { MachineInput, PredictionResult, AnalysisResult, MachineData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export async function predictMachineFailure(
    data: MachineInput,
    vehicleMetadata?: {
        vehicle_name?: string;
        model?: string;
        machine_age?: number;
        total_kilometers?: number;
    }
): Promise<PredictionResult> {
    try {
        // Combine machine data with optional vehicle metadata
        const requestData = {
            ...data,
            ...vehicleMetadata
        };

        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new APIError(
                error.detail || `API request failed with status ${response.status}`,
                response.status,
                error
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new APIError(
                'Cannot connect to API server. Please ensure the backend is running.'
            );
        }
        throw new APIError(
            `Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

export async function batchPredict(
    machines: MachineData[],
    onProgress?: (current: number, total: number) => void
): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (let i = 0; i < machines.length; i++) {
        const machine = machines[i];

        if (onProgress) {
            onProgress(i + 1, machines.length);
        }

        try {
            const prediction = await predictMachineFailure(machine);
            results.push({
                ...machine,
                prediction,
            });
        } catch (error) {
            // Continue processing other machines even if one fails
            console.error(`Failed to predict for machine ${machine.id}:`, error);

            // Add a default "error" result
            results.push({
                ...machine,
                prediction: {
                    failure: 0,
                    failure_probability: 0,
                    failure_types: null,
                },
            });
        }
    }

    return results;
}

export async function checkAPIHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
}
