import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Eye Tracking Validation Utilities
 */

export const analyzeLighting = (imageData) => {
  const data = imageData.data;
  let totalBrightness = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    totalBrightness += brightness;
    pixelCount++;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  if (avgBrightness < 50) {
    return {
      status: 'too_dark',
      value: avgBrightness,
      message: '⚠️ Too dark - Please increase lighting'
    };
  } else if (avgBrightness > 200) {
    return {
      status: 'too_bright',
      value: avgBrightness,
      message: '⚠️ Too bright - Please reduce lighting'
    };
  } else if (avgBrightness >= 80 && avgBrightness <= 160) {
    return {
      status: 'optimal',
      value: avgBrightness,
      message: '✅ Lighting is optimal'
    };
  } else {
    return {
      status: 'acceptable',
      value: avgBrightness,
      message: '⚡ Lighting is acceptable'
    };
  }
};

const detectSkinTone = (r, g, b) => {
  return (
    (r > 85 && g > 40 && b > 20 && 
     Math.max(r, g, b) - Math.min(r, g, b) > 10 &&
     Math.abs(r - g) > 10 && r > g && r > b) ||
    (r > 120 && r < 255 && g > 80 && g < 220 && b > 60 && b < 180 &&
     r > g && r > b && (r - g) > 15) ||
    (r > 200 && g > 180 && b > 170 && 
     Math.abs(r - g) < 30 && Math.abs(r - b) < 30) ||
    (r > 150 && r < 220 && g > 120 && g < 180 && b > 100 && b < 150 &&
     r > g && g > b)
  );
};

export const analyzeDistance = (imageData, width, height) => {
  const data = imageData.data;
  let facePixels = 0;
  let totalPixels = 0;
  
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const searchRadius = Math.min(width, height) / 3;
  
  for (let y = Math.max(0, centerY - searchRadius); y < Math.min(height, centerY + searchRadius); y++) {
    for (let x = Math.max(0, centerX - searchRadius); x < Math.min(width, centerX + searchRadius); x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalPixels++;
      
      if (detectSkinTone(r, g, b)) {
        facePixels++;
      }
    }
  }
  
  const facePercentage = totalPixels > 0 ? (facePixels / totalPixels) * 100 : 0;
  
  if (facePercentage < 2) {
    return { status: 'too_far', value: facePercentage, message: '⚠️ Too far' };
  } else if (facePercentage > 50) {
    return { status: 'too_close', value: facePercentage, message: '⚠️ Too close' };
  } else if (facePercentage >= 15 && facePercentage <= 35) {
    return { status: 'optimal', value: facePercentage, message: '✅ Distance optimal' };
  } else if (facePercentage >= 8 && facePercentage <= 45) {
    return { status: 'good', value: facePercentage, message: '⚡ Distance acceptable' };
  } else {
    return { status: 'no_face', value: facePercentage, message: '❌ No face detected' };
  }
};

export const validateEnvironment = (lightingResult, distanceResult) => {
  const faceDetected = distanceResult.status !== 'no_face';
  const isValidEnvironment = 
    (lightingResult.status === 'optimal' || lightingResult.status === 'acceptable') && 
    (distanceResult.status === 'optimal' || distanceResult.status === 'good' || distanceResult.status === 'acceptable');
  
  return { distance: distanceResult, lighting: lightingResult, faceDetected, isValidEnvironment };
};

export const getEnvironmentStatusColor = (status) => {
  switch (status) {
    case 'optimal': return '#4CAF50';
    case 'good':
    case 'acceptable': return '#FF9800';
    case 'too_dark':
    case 'too_bright':
    case 'too_close':
    case 'too_far': return '#F44336';
    case 'no_face': return '#9E9E9E';
    default: return '#757575';
  }
};

export const getStatusColor = (status) => {
  if (!status) return '#757575';
  switch (status.toLowerCase()) {
    case 'normal': return '#4CAF50';
    case 'opioid': return '#FF9800';
    case 'stimulant': return '#F44336';
    case 'neurological': return '#9C27B0';
    default: return '#757575';
  }
};

export const validateTestConditions = (environmentCheck) => {
  const errors = [];
  
  if (!environmentCheck.faceDetected) {
    errors.push('Please position your face in the camera view');
  }
  
  if (environmentCheck.lighting.status === 'too_dark' || environmentCheck.lighting.status === 'too_bright') {
    errors.push('Please adjust lighting conditions');
  }
  
  if (environmentCheck.distance.status === 'too_far') {
    errors.push('Please move closer to the camera');
  }
  
  if (environmentCheck.distance.status === 'too_close') {
    errors.push('Please move away from the camera');
  }
  
  return { isValid: errors.length === 0, errors };
};

// =============================================================================
// JSPDF PDF GENERATION
// =============================================================================

export const generateEyeTrackingPDF = async (reportData, onProgress, onSuccess, onError) => {
  try {
    onProgress?.('Generating PDF...');
    
    if (!reportData || !reportData.sessionId) {
      throw new Error('Invalid report data: missing session ID');
    }

    const { sessionId, testResults = {}, finalAnalysis, environmentCheck } = reportData;
    const timestamp = new Date().toLocaleString();

    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Helper function to add text with automatic line breaks
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 12,
        fontStyle = 'normal',
        color = [0, 0, 0],
        maxWidth = pageWidth - 2 * margin,
        align = 'left'
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(...color);

      if (align === 'center') {
        x = pageWidth / 2;
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line, index) => {
        if (align === 'center') {
          doc.text(line, x, y + (index * fontSize * 0.5), { align: 'center' });
        } else {
          doc.text(line, x, y + (index * fontSize * 0.5));
        }
      });

      return y + (lines.length * fontSize * 0.5) + 5;
    };

    // Header
    yPosition = addText('OptiScan Eye Analysis Report', margin, yPosition, {
      fontSize: 20,
      fontStyle: 'bold',
      color: [37, 99, 235],
      align: 'center'
    });

    yPosition = addText(`Generated: ${timestamp}`, margin, yPosition, {
      fontSize: 10,
      color: [107, 114, 128],
      align: 'center'
    });

    yPosition = addText(`Session: ${sessionId}`, margin, yPosition, {
      fontSize: 10,
      color: [107, 114, 128],
      align: 'center'
    });

    yPosition += 10;

    // Add horizontal line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Test Information Section
    yPosition = addText('Test Information', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [17, 24, 39]
    });

    const testInfoData = [
      ['Test Date', new Date().toLocaleDateString()],
      ['Test Time', new Date().toLocaleTimeString()],
      ['Environment', environmentCheck?.isValidEnvironment ? 'Optimal' : 'Suboptimal'],
      ['Authentication', 'Verified Session']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: testInfoData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Analysis Results Section
    yPosition = addText('Analysis Results', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [17, 24, 39]
    });

    const analysisData = [];

    // Ear Detection Results
    if (testResults.earDetection) {
      analysisData.push(['Ear Detection Analysis', '']);
      analysisData.push(['Left Ear Score', `${(testResults.earDetection.left_ear_score * 100).toFixed(1)}%`]);
      analysisData.push(['Right Ear Score', `${(testResults.earDetection.right_ear_score * 100).toFixed(1)}%`]);
      analysisData.push(['Result', testResults.earDetection.result || 'Completed']);
      analysisData.push(['', '']); // Empty row for spacing
    } else {
      analysisData.push(['Ear Detection', 'Not Performed']);
      analysisData.push(['', '']); // Empty row for spacing
    }

    // Pupil Analysis Results
    if (testResults.pupilDilation) {
      analysisData.push(['Pupil Analysis', '']);
      analysisData.push(['Left Pupil', `${testResults.pupilDilation.left_pupil_mm?.toFixed(2) || 'N/A'} mm`]);
      analysisData.push(['Right Pupil', `${testResults.pupilDilation.right_pupil_mm?.toFixed(2) || 'N/A'} mm`]);
      analysisData.push(['Result', testResults.pupilDilation.result || 'Normal']);
      analysisData.push(['', '']); // Empty row for spacing
    } else {
      analysisData.push(['Pupil Analysis', 'Not Performed']);
      analysisData.push(['', '']); // Empty row for spacing
    }

    // Blink Analysis Results
    if (testResults.blinkCount) {
      analysisData.push(['Blink Analysis', '']);
      analysisData.push(['Total Blinks', testResults.blinkCount.total_blinks?.toString() || 'N/A']);
      analysisData.push(['Blink Rate', `${testResults.blinkCount.blinks_per_minute?.toFixed(1) || 'N/A'} bpm`]);
      analysisData.push(['Result', testResults.blinkCount.result || 'Normal']);
    } else {
      analysisData.push(['Blink Analysis', 'Not Performed']);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: analysisData,
      theme: 'striped',
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Style section headers
        if (data.cell.text[0] && (
          data.cell.text[0].includes('Analysis') || 
          data.cell.text[0].includes('Detection')
        ) && data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Clinical Summary Section
    yPosition = addText('Clinical Summary', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [17, 24, 39]
    });

    const summaryData = [];
    
    if (finalAnalysis) {
      summaryData.push(['Status', finalAnalysis.final_status || 'Unknown']);
      summaryData.push(['Confidence', `${finalAnalysis.confidence?.toFixed(1) || 'N/A'}%`]);
      
      if (finalAnalysis.summary) {
        summaryData.push(['Summary', finalAnalysis.summary]);
      }
    } else {
      summaryData.push(['Analysis', 'Incomplete']);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Color code status
        if (data.cell.text[0] === 'NORMAL' && data.column.index === 1) {
          data.cell.styles.textColor = [5, 150, 105]; // Green
        } else if (data.cell.text[0] && data.cell.text[0] !== 'NORMAL' && data.cell.text[0] !== 'Unknown' && data.column.index === 1 && data.row.index === 0) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        }
      }
    });

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    addText(`OptiScan Eye Analysis System • Confidential Medical Report • ${timestamp}`, margin, footerY, {
      fontSize: 8,
      color: [156, 163, 175],
      align: 'center'
    });

    // Generate filename and download
    const dateStamp = new Date().toISOString().split('T')[0];
    const timeStamp = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `OptiScan_Report_${sessionId}_${dateStamp}_${timeStamp}.pdf`;

    doc.save(fileName);

    onSuccess?.('PDF generated successfully!');
    return true;

  } catch (error) {
    console.error('PDF Generation Error:', error);
    onError?.(`PDF Generation Failed: ${error.message}`);
    return false;
  }
};

// =============================================================================
// SIMPLE TEXT REPORT (BACKUP)
// =============================================================================


export const downloadSimpleReport = (reportData, onSuccess, onError) => {
  try {
    if (!reportData || !reportData.sessionId) {
      throw new Error('Invalid report data: missing session ID');
    }

    const { sessionId, testResults = {}, finalAnalysis } = reportData;
    const timestamp = new Date().toLocaleString();
    
    let report = `
OptiScan Eye Analysis Report
==========================================
Generated: ${timestamp}
Session: ${sessionId}

Test Results:
==========================================
`;

    if (testResults.earDetection) {
      report += `
Ear Detection:
- Left Ear: ${(testResults.earDetection.left_ear_score * 100).toFixed(1)}%
- Right Ear: ${(testResults.earDetection.right_ear_score * 100).toFixed(1)}%
- Result: ${testResults.earDetection.result || 'Completed'}
`;
    }

    if (testResults.pupilDilation) {
      report += `
Pupil Analysis:
- Left Pupil: ${testResults.pupilDilation.left_pupil_mm?.toFixed(2) || 'N/A'} mm
- Right Pupil: ${testResults.pupilDilation.right_pupil_mm?.toFixed(2) || 'N/A'} mm
- Result: ${testResults.pupilDilation.result || 'Normal'}
`;
    }

    if (testResults.blinkCount) {
      report += `
Blink Analysis:
- Total Blinks: ${testResults.blinkCount.total_blinks || 'N/A'}
- Blink Rate: ${testResults.blinkCount.blinks_per_minute?.toFixed(1) || 'N/A'} bpm
- Result: ${testResults.blinkCount.result || 'Normal'}
`;
    }

    if (finalAnalysis) {
      report += `
Clinical Summary:
==========================================
- Status: ${finalAnalysis.final_status || 'Unknown'}
- Confidence: ${finalAnalysis.confidence?.toFixed(1) || 'N/A'}%
- Summary: ${finalAnalysis.summary || 'No summary available'}
`;
    }

    report += `
==========================================
OptiScan Eye Analysis System
Confidential Medical Report
Generated: ${timestamp}
==========================================`;

    const fileName = `OptiScan_SimpleReport_${sessionId}_${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([report], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    onSuccess?.('Simple report downloaded successfully!');
    return true;
    
  } catch (error) {
    console.error('Simple report generation failed:', error);
    onError?.(`Failed to generate simple report: ${error.message}`);
    return false;
  }
};


export default {
  analyzeLighting,
  analyzeDistance,
  validateEnvironment,
  getEnvironmentStatusColor,
  getStatusColor,
  validateTestConditions,
  generateEyeTrackingPDF,
  downloadSimpleReport
};