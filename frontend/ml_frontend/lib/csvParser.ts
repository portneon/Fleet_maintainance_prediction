import { MachineInput, MachineData } from '@/types';
import { calculateMachineType } from './machineTypeCalculator';

const REQUIRED_HEADERS = [
    'Air_temperature',
    'Process_temperature',
    'Rotational_speed',
    'Torque',
    'Tool_wear',
    'machine_age',
    'total_kilometers'
];

export class CSVParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CSVParseError';
    }
}

export async function parseCSVFile(file: File): Promise<MachineData[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = parseCSVText(text);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new CSVParseError('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

function parseCSVText(text: string): MachineData[] {
    const lines = text.trim().split('\n');

    if (lines.length < 2) {
        throw new CSVParseError('CSV file is empty or contains only headers');
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());

    // Validate headers
    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        throw new CSVParseError(
            `Missing required columns: ${missingHeaders.join(', ')}`
        );
    }

    // Parse data rows
    const data: MachineData[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = line.split(',').map(v => v.trim());

        if (values.length !== headers.length) {
            throw new CSVParseError(
                `Row ${i} has ${values.length} columns, expected ${headers.length}`
            );
        }

        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });

        try {
            const machineData = parseRow(row, i);
            data.push(machineData);
        } catch (error) {
            throw new CSVParseError(
                `Error parsing row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    if (data.length === 0) {
        throw new CSVParseError('No valid data rows found in CSV');
    }

    return data;
}

function parseRow(row: any, rowIndex: number): MachineData {
    const parseNumber = (value: string, field: string): number => {
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`Invalid number for ${field}: "${value}"`);
        }
        return num;
    };

    const airTemp = parseNumber(row.Air_temperature, 'Air_temperature');
    const procTemp = parseNumber(row.Process_temperature, 'Process_temperature');
    const rpm = parseNumber(row.Rotational_speed, 'Rotational_speed');
    const torque = parseNumber(row.Torque, 'Torque');
    const wear = parseNumber(row.Tool_wear, 'Tool_wear');
    const machineAge = parseNumber(row.machine_age, 'machine_age');
    const totalKm = parseNumber(row.total_kilometers, 'total_kilometers');

    // Calculate machine type from age and kilometers
    const machineTypeResult = calculateMachineType(machineAge, totalKm);
    const { type, Type_L: typeL, Type_M: typeM } = machineTypeResult;

    return {
        id: `MACHINE-${rowIndex.toString().padStart(5, '0')}`,
        type,
        Air_temperature: airTemp,
        Process_temperature: procTemp,
        Rotational_speed: rpm,
        Torque: torque,
        Tool_wear: wear,
        Type_L: typeL,
        Type_M: typeM,
    };
}

export function validateCSVFile(file: File): string | null {
    if (!file) {
        return 'Please select a file';
    }

    if (!file.name.endsWith('.csv')) {
        return 'File must be a CSV (.csv extension)';
    }

    if (file.size === 0) {
        return 'File is empty';
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return 'File is too large (max 10MB)';
    }

    return null;
}
