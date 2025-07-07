/**
 * Eye Tracking Validation Utilities
 * Contains lighting and distance validation functions for eye tracking analysis
 */

/**
 * Analyzes lighting conditions from webcam image data
 * @param {ImageData} imageData - Canvas image data from webcam
 * @returns {Object} Lighting analysis result with status, value, and message
 */
export const analyzeLighting = (imageData) => {
  const data = imageData.data;
  let totalBrightness = 0;
  let pixelCount = 0;
  
  // Calculate average brightness using luminance formula
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Calculate brightness using luminance formula
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    totalBrightness += brightness;
    pixelCount++;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Determine lighting status based on brightness thresholds
  if (avgBrightness < 50) {
    return {
      status: 'too_dark',
      value: avgBrightness,
      message: '⚠️ Too dark - Please increase lighting or move to brighter area'
    };
  } else if (avgBrightness > 200) {
    return {
      status: 'too_bright',
      value: avgBrightness,
      message: '⚠️ Too bright - Please reduce lighting or avoid direct light'
    };
  } else if (avgBrightness >= 80 && avgBrightness <= 160) {
    return {
      status: 'optimal',
      value: avgBrightness,
      message: '✅ Lighting is optimal for analysis'
    };
  } else {
    return {
      status: 'acceptable',
      value: avgBrightness,
      message: '⚡ Lighting is acceptable but could be improved'
    };
  }
};

/**
 * Enhanced skin tone detection for multiple ethnicities and lighting conditions
 * @param {number} r - Red channel value (0-255)
 * @param {number} g - Green channel value (0-255) 
 * @param {number} b - Blue channel value (0-255)
 * @returns {boolean} True if pixel matches skin tone criteria
 */
const detectSkinTone = (r, g, b) => {
  return (
    // Original skin tone criteria (more relaxed)
    (r > 85 && g > 40 && b > 20 && 
     Math.max(r, g, b) - Math.min(r, g, b) > 10 &&
     Math.abs(r - g) > 10 && r > g && r > b) ||
    
    // Additional skin tone ranges
    (r > 120 && r < 255 && g > 80 && g < 220 && b > 60 && b < 180 &&
     r > g && r > b && (r - g) > 15) ||
    
    // Lighter skin tones
    (r > 200 && g > 180 && b > 170 && 
     Math.abs(r - g) < 30 && Math.abs(r - b) < 30) ||
    
    // Medium skin tones
    (r > 150 && r < 220 && g > 120 && g < 180 && b > 100 && b < 150 &&
     r > g && g > b)
  );
};

/**
 * Analyzes distance by detecting face size in the camera frame
 * @param {ImageData} imageData - Canvas image data from webcam
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {Object} Distance analysis result with status, value, and message
 */
export const analyzeDistance = (imageData, width, height) => {
  const data = imageData.data;
  let facePixels = 0;
  let totalPixels = 0;
  
  // Look for face-like regions in center area
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const searchRadius = Math.min(width, height) / 3; // Larger search area
  
  // More comprehensive face detection in center region
  for (let y = Math.max(0, centerY - searchRadius); y < Math.min(height, centerY + searchRadius); y++) {
    for (let x = Math.max(0, centerX - searchRadius); x < Math.min(width, centerX + searchRadius); x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalPixels++;
      
      // Use enhanced skin tone detection
      if (detectSkinTone(r, g, b)) {
        facePixels++;
      }
    }
  }
  
  // Calculate face percentage in search area
  const facePercentage = totalPixels > 0 ? (facePixels / totalPixels) * 100 : 0;
  
  // Also check for general brightness variations (face vs background contrast)
  let brightPixels = 0;
  let darkPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    
    if (brightness > 150) brightPixels++;
    if (brightness < 80) darkPixels++;
  }
  
  const totalImagePixels = data.length / 4;
  const contrastRatio = (brightPixels + darkPixels) / totalImagePixels;
  
  // Combine face detection with contrast analysis for better accuracy
  const adjustedFacePercentage = Math.max(facePercentage, contrastRatio * 20);
  
  // Debug logging
  console.log(`Face detection - Raw: ${facePercentage.toFixed(2)}%, Adjusted: ${adjustedFacePercentage.toFixed(2)}%`);
  
  // Estimate distance based on adjusted face size with multiple thresholds
  if (adjustedFacePercentage < 2) {
    return {
      status: 'too_far',
      value: adjustedFacePercentage,
      message: '⚠️ Too far - Please move closer to the camera (50-70cm recommended)'
    };
  } else if (adjustedFacePercentage > 50) {
    return {
      status: 'too_close',
      value: adjustedFacePercentage,
      message: '⚠️ Too close - Please move away from the camera'
    };
  } else if (adjustedFacePercentage >= 15 && adjustedFacePercentage <= 35) {
    return {
      status: 'optimal',
      value: adjustedFacePercentage,
      message: '✅ Distance is optimal for analysis'
    };
  } else if (adjustedFacePercentage >= 8 && adjustedFacePercentage <= 45) {
    return {
      status: 'good',
      value: adjustedFacePercentage,
      message: '⚡ Distance is acceptable'
    };
  } else if (adjustedFacePercentage >= 5) {
    return {
      status: 'acceptable',
      value: adjustedFacePercentage,
      message: '👤 Person detected - adjust position for better accuracy'
    };
  } else {
    return {
      status: 'no_face',
      value: adjustedFacePercentage,
      message: '❌ No face detected - Please position your face in the camera'
    };
  }
};

/**
 * Validates overall environment conditions for eye tracking
 * @param {Object} lightingResult - Result from analyzeLighting()
 * @param {Object} distanceResult - Result from analyzeDistance()
 * @returns {Object} Environment validation result
 */
export const validateEnvironment = (lightingResult, distanceResult) => {
  const faceDetected = distanceResult.status !== 'no_face';
  
  // More lenient validation - accepts acceptable conditions
  const isValidEnvironment = 
    (lightingResult.status === 'optimal' || lightingResult.status === 'acceptable') && 
    (distanceResult.status === 'optimal' || distanceResult.status === 'good' || distanceResult.status === 'acceptable');
  
  return {
    distance: distanceResult,
    lighting: lightingResult,
    faceDetected,
    isValidEnvironment
  };
};

/**
 * Gets color code for environment status indicators
 * @param {string} status - Status string (optimal, acceptable, etc.)
 * @returns {string} Hex color code
 */
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

/**
 * Gets color code for analysis result status
 * @param {string} status - Analysis result status
 * @returns {string} Hex color code
 */
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

/**
 * Checks if lighting and distance conditions are suitable for testing
 * @param {Object} environmentCheck - Current environment state
 * @returns {Object} Validation result with errors if any
 */
export const validateTestConditions = (environmentCheck) => {
  const errors = [];
  
  if (!environmentCheck.faceDetected) {
    errors.push('Please position your face in the camera view');
  }
  
  if (environmentCheck.lighting.status === 'too_dark' || environmentCheck.lighting.status === 'too_bright') {
    errors.push('Please adjust lighting conditions for better results');
  }
  
  if (environmentCheck.distance.status === 'too_far') {
    errors.push('Please move closer to the camera');
  }
  
  if (environmentCheck.distance.status === 'too_close') {
    errors.push('Please move away from the camera');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Constants for validation thresholds
 */
export const VALIDATION_CONSTANTS = {
  LIGHTING: {
    TOO_DARK_THRESHOLD: 50,
    TOO_BRIGHT_THRESHOLD: 200,
    OPTIMAL_MIN: 80,
    OPTIMAL_MAX: 160
  },
  DISTANCE: {
    TOO_FAR_THRESHOLD: 2,
    TOO_CLOSE_THRESHOLD: 50,
    OPTIMAL_MIN: 15,
    OPTIMAL_MAX: 35,
    GOOD_MIN: 8,
    GOOD_MAX: 45,
    ACCEPTABLE_MIN: 5
  },
  SEARCH_RADIUS_RATIO: 1/3, // Fraction of min(width, height) for face search area
  CONTRAST_MULTIPLIER: 20    // Multiplier for contrast-based detection
};