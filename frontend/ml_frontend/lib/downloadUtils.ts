import { AnalysisResult, MaintenanceReport } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function downloadCSV(data: AnalysisResult[], filename: string = 'predictions.csv'): void {
    const headers = [
        'ID',
        'Type',
        'Air_Temperature',
        'Process_Temperature',
        'Rotational_Speed',
        'Torque',
        'Tool_Wear',
        'Failure',
        'Failure_Probability',
        'Failure_Types'
    ];

    const rows = data.map(item => [
        item.id,
        item.type,
        item.Air_temperature,
        item.Process_temperature,
        item.Rotational_speed,
        item.Torque,
        item.Tool_wear,
        item.prediction.failure,
        item.prediction.failure_probability.toFixed(4),
        item.prediction.failure_types
            ? Object.entries(item.prediction.failure_types)
                .map(([type, prob]) => `${type}:${prob.toFixed(4)}`)
                .join(';')
            : 'None'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    downloadFile(csvContent, filename, 'text/csv');
}

export function downloadJSON(data: AnalysisResult[], filename: string = 'predictions.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
}

export function downloadSingleResult(result: AnalysisResult, format: 'csv' | 'json' = 'json'): void {
    const filename = `${result.id}_prediction.${format}`;

    if (format === 'csv') {
        downloadCSV([result], filename);
    } else {
        downloadJSON([result], filename);
    }
}

export async function downloadMaintenanceReportPDF(
    report: MaintenanceReport,
    machineId: string = 'Machine'
): Promise<void> {
    try {
        // Create a temporary container for rendering
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '800px';
        container.style.padding = '20px';
        container.style.backgroundColor = 'white';
        container.style.fontFamily = 'Arial, sans-serif';
        
        // Build HTML content
        const htmlContent = `
            <div style="font-family: Arial, sans-serif;">
                <h1 style="color: #1f2937; margin-bottom: 10px;">Maintenance Report</h1>
                <p style="color: #6b7280; margin-bottom: 20px;">Machine ID: ${machineId}</p>
                
                <div style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px; background: #f9fafb; border-radius: 4px;">
                    <h2 style="font-size: 14px; color: #374151; margin: 0 0 10px 0;">Status</h2>
                    <p style="margin: 0; color: #1f2937; font-weight: bold;">${report.status}</p>
                </div>

                ${report.vehicle_info ? `
                <div style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px; background: #f9fafb; border-radius: 4px;">
                    <h2 style="font-size: 14px; color: #374151; margin: 0 0 10px 0;">Vehicle Information</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr>
                            <td style="padding: 5px 0;"><strong>Name:</strong></td>
                            <td style="padding: 5px 0;">${report.vehicle_info.name}</td>
                            <td style="padding: 5px 0; padding-left: 20px;"><strong>Model:</strong></td>
                            <td style="padding: 5px 0;">${report.vehicle_info.model}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Quality:</strong></td>
                            <td style="padding: 5px 0;">${report.vehicle_info.quality}</td>
                            <td style="padding: 5px 0; padding-left: 20px;"><strong>Age:</strong></td>
                            <td style="padding: 5px 0;">${report.vehicle_info.age_years} years</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Total Distance:</strong></td>
                            <td colspan="3" style="padding: 5px 0;">${report.vehicle_info.total_km.toLocaleString()} km</td>
                        </tr>
                    </table>
                </div>
                ` : ''}

                <div style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px; background: #f9fafb; border-radius: 4px;">
                    <h2 style="font-size: 14px; color: #374151; margin: 0 0 10px 0;">AI-Powered Maintenance Analysis</h2>
                    <div style="line-height: 1.6; font-size: 12px; color: #374151; white-space: pre-wrap; word-wrap: break-word;">
                        ${report.report || report.summary || 'No detailed report available'}
                    </div>
                </div>

                <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #6b7280;">
                    <p style="margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
                    <p style="margin: 5px 0 0 0;">Status: ${report.groq_available ? 'AI-Powered Analysis' : 'Basic Analysis'}</p>
                </div>
            </div>
        `;
        
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
        
        // Convert to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // A4 width
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let yPosition = 10;
        
        // Add image to PDF (splitting into pages if needed)
        if (imgHeight > 277) {
            let remainingHeight = imgHeight;
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            while (remainingHeight > 0) {
                const pageHeight = 277;
                const currentHeight = Math.min(remainingHeight, pageHeight);
                const sourceY = (imgHeight - remainingHeight) * (canvas.height / imgHeight);
                const sourceHeight = (currentHeight * canvas.height) / imgHeight;
                
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sourceHeight;
                const ctx = pageCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(canvas, 0, -sourceY, canvas.width, canvas.height);
                    const pageImgData = pageCanvas.toDataURL('image/png');
                    pdf.addImage(pageImgData, 'PNG', 10, yPosition, imgWidth, currentHeight);
                }
                
                remainingHeight -= currentHeight;
                yPosition = 10;
                
                if (remainingHeight > 0) {
                    pdf.addPage();
                }
            }
        } else {
            pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
        }
        
        // Save PDF
        const filename = `maintenance_report_${machineId}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
        
        // Cleanup
        document.body.removeChild(container);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}
