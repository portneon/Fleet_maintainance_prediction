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

// Helper function to convert markdown to HTML for PDF
function convertMarkdownToHTML(text: string): string {
    if (!text) return '';

    const lines = text.split('\n');
    let html = '';

    for (const line of lines) {
        // Handle ### headers
        if (line.trim().startsWith('###')) {
            const headerText = line.replace(/^###\s*/, '').replace(/\*\*/g, '');
            html += `<h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 15px 0 8px 0; page-break-after: avoid;">${headerText}</h3>`;
        }
        // Handle regular lines with bold
        else {
            let processedLine = line;
            // Replace **bold** with <strong>
            processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold; color: #1f2937;">$1</strong>');

            // Add line break if not empty
            if (processedLine.trim()) {
                html += `<p style="margin: 4px 0; line-height: 1.6; page-break-inside: avoid;">${processedLine}</p>`;
            } else {
                html += '<br />';
            }
        }
    }

    return html;
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

        // Convert markdown report to HTML
        const reportHTML = convertMarkdownToHTML(report.report || report.summary || 'No detailed report available');

        // Build HTML content
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; font-size: 13px;">
                <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 24px; page-break-after: avoid;">Maintenance Analysis Report</h1>
                <p style="color: #6b7280; margin-bottom: 20px; font-size: 12px;">Machine ID: ${machineId}</p>
                
                <div style="border: 2px solid #e5e7eb; padding: 15px; margin-bottom: 15px; background: #f9fafb; border-radius: 4px; page-break-inside: avoid;">
                    <h2 style="font-size: 16px; color: #374151; margin: 0 0 8px 0; font-weight: bold;">Status</h2>
                    <p style="margin: 0; color: #1f2937; font-weight: bold; font-size: 14px;">${report.status}</p>
                </div>

                ${report.vehicle_info ? `
                <div style="border: 2px solid #e5e7eb; padding: 15px; margin-bottom: 15px; background: #f9fafb; border-radius: 4px; page-break-inside: avoid;">
                    <h2 style="font-size: 16px; color: #374151; margin: 0 0 10px 0; font-weight: bold;">Vehicle Information</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 0; width: 25%;"><strong>Name:</strong></td>
                            <td style="padding: 6px 0; width: 25%;">${report.vehicle_info.name}</td>
                            <td style="padding: 6px 0; width: 25%; padding-left: 15px;"><strong>Model:</strong></td>
                            <td style="padding: 6px 0; width: 25%;">${report.vehicle_info.model}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><strong>Quality:</strong></td>
                            <td style="padding: 6px 0;">${report.vehicle_info.quality}</td>
                            <td style="padding: 6px 0; padding-left: 15px;"><strong>Age:</strong></td>
                            <td style="padding: 6px 0;">${report.vehicle_info.age_years} years</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><strong>Total Distance:</strong></td>
                            <td colspan="3" style="padding: 6px 0;">${report.vehicle_info.total_km.toLocaleString()} km</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><strong>Type:</strong></td>
                            <td colspan="3" style="padding: 6px 0;">Type ${report.vehicle_info.type}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}

                <div style="border: 2px solid #e5e7eb; padding: 15px; margin-bottom: 15px; background: #f9fafb; border-radius: 4px;">
                    <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px 0; font-weight: bold; page-break-after: avoid;">AI-Powered Maintenance Analysis</h2>
                    <div style="line-height: 1.7; font-size: 13px; color: #374151;">
                        ${reportHTML}
                    </div>
                </div>

                <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #6b7280; page-break-inside: avoid;">
                    <p style="margin: 0;"><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Analysis Type:</strong> ${report.groq_available ? 'AI-Powered Analysis' : 'Basic Analysis'}</p>
                </div>
            </div>
        `;

        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        // Convert to canvas with better quality
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 800,
            windowHeight: container.scrollHeight
        });

        // Create PDF with better page handling
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // A4 width in mm (210mm - 10mm margins on each side)
        const pageHeight = 277; // A4 height in mm (297mm - 10mm margins on each side)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10; // Top margin

        // Add first page
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10; // Account for top margin
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
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
