/**
 * Calculate machine type based on age and total kilometers
 * 
 * Logic:
 * - Medium Quality (M): Newer machines with moderate usage
 * - Low Quality (L): Older machines with high usage
 */

export interface MachineTypeResult {
    type: 'M' | 'L';
    Type_L: boolean;
    Type_M: boolean;
}

export function calculateMachineType(
    machineAge: number, // in years
    totalKilometers: number // total km
): MachineTypeResult {
    // Define thresholds
    const AGE_THRESHOLD = 3; // More than 3 years = older
    const KM_THRESHOLD = 100000; // More than 100k km = high usage

    // Calculate a score based on age and kilometers
    // Lower score = better quality (newer, less used)
    const ageScore = machineAge / 10; // Normalize age (0-1 range for 0-10 years)
    const kmScore = totalKilometers / 200000; // Normalize km (0-1 range for 0-200k km)

    // Combined score (weighted average: 40% age, 60% kilometers)
    const combinedScore = (ageScore * 0.4) + (kmScore * 0.6);

    // Determine type based on combined score
    // Only two quality levels: Medium (M) and Low (L)
    if (combinedScore < 0.5) {
        // Medium quality: Newer machines with moderate usage
        return {
            type: 'M',
            Type_L: false,
            Type_M: true
        };
    } else {
        // Low quality: Older machines with high usage
        return {
            type: 'L',
            Type_L: true,
            Type_M: false
        };
    }
}

export function getMachineTypeLabel(type: 'M' | 'L'): string {
    const labels = {
        M: 'Medium Quality (Moderate Usage)',
        L: 'Low Quality (High Usage)'
    };
    return labels[type];
}
