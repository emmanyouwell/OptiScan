import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Provider as PaperProvider,
  DefaultTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseURL';

const { width, height } = Dimensions.get('window');

// Simple theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007BFF',
    accent: '#0056B3',
  },
};

export default function EyeScanResults({ navigation, route }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get scan data from navigation params or fetch from API
  const { scanData: routeScanData, scanId } = route.params || {};

  useEffect(() => {
    console.log('🔍 EyeScanResults mounted with params:', { routeScanData: !!routeScanData, scanId });
    
    if (routeScanData) {
      console.log('📝 Using route scan data:', routeScanData);
      setScanData(routeScanData);
      setIsLoading(false);
    } else if (scanId) {
      console.log('🔄 Fetching scan by ID:', scanId);
      fetchScanData(scanId);
    } else {
      console.log('🔄 Fetching latest scan');
      fetchLatestScan();
    }
  }, []);

  // Get authentication token
  const getAuthToken = async () => {
    try {
      const loginResponse = await AsyncStorage.getItem('loginResponse');
      if (loginResponse) {
        const loginData = JSON.parse(loginResponse);
        if (loginData.access_token) {
          return loginData.access_token;
        }
      }
      
      const token = await AsyncStorage.getItem('authToken');
      if (token) return token;
      
      throw new Error('No authentication token found');
    } catch (error) {
      throw new Error('Authentication required');
    }
  };

  // Fetch specific scan by ID
  const fetchScanData = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authToken = await getAuthToken();
      console.log('🔐 Using auth token for scan fetch');
      
      const response = await axios.get(
        `${baseURL}/api/eye-scan/scan/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      
      console.log('✅ Scan data received:', response.data);
      
      const { scan, user_info } = response.data;
      
      // Format data to match expected structure
      const formattedData = formatScanData(scan, user_info);
      console.log('📝 Formatted scan data:', formattedData);
      
      setScanData(formattedData);
    } catch (error) {
      console.error('❌ Error fetching scan data:', error);
      setError('Failed to load scan data');
      
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load scan data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch latest scan
  const fetchLatestScan = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authToken = await getAuthToken();
      console.log('🔐 Using auth token for latest scan fetch');
      
      const response = await axios.get(
        `${baseURL}/api/eye-scan/latest-scan`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      
      console.log('✅ Latest scan data received:', response.data);
      
      const { scan, user_info } = response.data;
      
      // Format data to match expected structure
      const formattedData = formatScanData(scan, user_info);
      console.log('📝 Formatted latest scan data:', formattedData);
      
      setScanData(formattedData);
    } catch (error) {
      console.error('❌ Error fetching latest scan:', error);
      setError('No scan data found');
      
      if (error.response?.status === 404) {
        Alert.alert('No Scans Found', 'No eye scan results found. Please perform a scan first.', [
          {
            text: 'Take Scan',
            onPress: () => navigation.navigate('Eye_Scan')
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack()
          }
        ]);
      } else if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load scan data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format scan data from backend to expected frontend format
  const formatScanData = (scan, user_info) => {
    console.log('🔄 Formatting scan data:', { scan, user_info });
    
    // Extract analysis results from the scan data
    const leftEyeAnalysis = scan.left_eye_analysis || {};
    const rightEyeAnalysis = scan.right_eye_analysis || {};
    
    // Get probability scores (this should match your backend model output)
    const leftEyeScores = leftEyeAnalysis.probability_scores || {};
    const rightEyeScores = rightEyeAnalysis.probability_scores || {};
    
    // Calculate combined scores (average of both eyes)
    const combinedScores = {};
    const allConditions = new Set([...Object.keys(leftEyeScores), ...Object.keys(rightEyeScores)]);
    
    allConditions.forEach(condition => {
      const leftScore = leftEyeScores[condition] || 0;
      const rightScore = rightEyeScores[condition] || 0;
      combinedScores[condition] = (leftScore + rightScore) / 2;
    });
    
    // Determine final prediction
    let finalCondition = 'normal';
    let finalConfidence = 0;
    
    if (Object.keys(combinedScores).length > 0) {
      const sortedScores = Object.entries(combinedScores).sort((a, b) => b[1] - a[1]);
      finalCondition = sortedScores[0][0];
      finalConfidence = sortedScores[0][1] * 100;
    }
    
    // Use the highest confidence condition from either eye if combined is not available
    if (finalConfidence === 0) {
      if (leftEyeAnalysis.confidence && leftEyeAnalysis.condition) {
        finalCondition = leftEyeAnalysis.condition;
        finalConfidence = leftEyeAnalysis.confidence;
      } else if (rightEyeAnalysis.confidence && rightEyeAnalysis.condition) {
        finalCondition = rightEyeAnalysis.condition;
        finalConfidence = rightEyeAnalysis.confidence;
      }
    }
    
    const formattedData = {
      scanId: scan._id || scan.scan_id,
      leftEye: scan.left_eye_image,
      rightEye: scan.right_eye_image,
      age: scan.age,
      gender: scan.gender,
      timestamp: scan.timestamp,
      userInfo: {
        username: user_info?.username || 'Unknown',
        email: user_info?.email || '',
        age: user_info?.age || scan.age,
        gender: user_info?.gender || scan.gender
      },
      results: {
        left_eye: leftEyeScores,
        right_eye: rightEyeScores,
        combined: combinedScores,
        final_prediction: {
          condition: finalCondition,
          confidence: finalConfidence,
          risk_level: scan.overall_risk_level || getRiskLevel(finalConfidence)
        },
        recommendations: scan.study_references || scan.recommendations || [],
        overall_assessment: scan.overall_assessment || scan.clinical_summary || 'Analysis completed'
      }
    };
    
    console.log('✅ Final formatted data:', formattedData);
    return formattedData;
  };

  // Helper function to determine risk level based on confidence
  const getRiskLevel = (confidence) => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  };

  // Format condition name
  const formatConditionName = (condition) => {
    if (!condition) return 'Unknown';
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get condition color
  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'normal':
        return '#28A745';
      case 'diabetic_retinopathy':
      case 'diabetic retinopathy':
        return '#DC3545';
      case 'glaucoma':
        return '#FFC107';
      case 'cataract':
        return '#6F42C1';
      default:
        return '#6C757D';
    }
  };

  // Generate HTML content for PDF
  const generateHTMLContent = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    const results = scanData.results;
    const finalPrediction = results?.final_prediction || {};
    const leftEyeResults = results?.left_eye || {};
    const rightEyeResults = results?.right_eye || {};
    const combinedResults = results?.combined || {};
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
                line-height: 1.4;
            }
            .header {
                text-align: center;
                background-color: #007BFF;
                color: white;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .subtitle {
                font-size: 14px;
            }
            .section {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                page-break-inside: avoid;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #007BFF;
                margin-bottom: 10px;
            }
            .info-item {
                margin: 8px 0;
                padding: 8px;
                background-color: #f8f9fa;
                border-radius: 4px;
            }
            .result-main {
                background-color: #e3f2fd;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 15px 0;
            }
            .condition-name {
                font-size: 20px;
                font-weight: bold;
                color: #007BFF;
                margin-bottom: 8px;
            }
            .confidence {
                font-size: 16px;
                color: #28a745;
                margin-bottom: 10px;
            }
            .risk-level {
                display: inline-block;
                padding: 6px 12px;
                background-color: #007BFF;
                color: white;
                border-radius: 15px;
                font-weight: bold;
                font-size: 12px;
            }
            .analysis-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .condition {
                font-weight: 500;
            }
            .percentage {
                font-weight: bold;
                color: #007BFF;
            }
            .recommendation {
                margin: 6px 0;
                padding-left: 15px;
                position: relative;
            }
            .recommendation:before {
                content: "•";
                position: absolute;
                left: 0;
                color: #007BFF;
                font-weight: bold;
            }
            .disclaimer {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
            }
            @media print {
                body { margin: 0; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">👁️ OptiScan</div>
            <div class="subtitle">AI-Powered Eye Disease Detection Report</div>
        </div>

        <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-item"><strong>Name:</strong> ${scanData.userInfo?.username || 'Anonymous'}</div>
            <div class="info-item"><strong>Age:</strong> ${scanData.age} years</div>
            <div class="info-item"><strong>Gender:</strong> ${scanData.gender || 'Not specified'}</div>
            <div class="info-item"><strong>Email:</strong> ${scanData.userInfo?.email || 'Not provided'}</div>
            <div class="info-item"><strong>Scan Date:</strong> ${new Date(scanData.timestamp).toLocaleDateString()} at ${new Date(scanData.timestamp).toLocaleTimeString()}</div>
            <div class="info-item"><strong>Scan ID:</strong> ${scanData.scanId || 'N/A'}</div>
        </div>

        <div class="section">
            <div class="section-title">AI Analysis Results</div>
            <div class="result-main">
                <div class="condition-name">${formatConditionName(finalPrediction.condition)}</div>
                <div class="confidence">Confidence: ${finalPrediction.confidence?.toFixed(1) || 0}%</div>
                <div class="risk-level">Risk Level: ${finalPrediction.risk_level?.toUpperCase() || 'LOW'}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Left Eye Analysis</div>
            ${Object.entries(leftEyeResults).map(([condition, probability]) => `
                <div class="analysis-row">
                    <span class="condition">${formatConditionName(condition)}</span>
                    <span class="percentage">${(probability * 100).toFixed(1)}%</span>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <div class="section-title">Right Eye Analysis</div>
            ${Object.entries(rightEyeResults).map(([condition, probability]) => `
                <div class="analysis-row">
                    <span class="condition">${formatConditionName(condition)}</span>
                    <span class="percentage">${(probability * 100).toFixed(1)}%</span>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <div class="section-title">Combined Analysis</div>
            ${Object.entries(combinedResults).map(([condition, probability]) => `
                <div class="analysis-row">
                    <span class="condition">${formatConditionName(condition)}</span>
                    <span class="percentage">${(probability * 100).toFixed(1)}%</span>
                </div>
            `).join('')}
        </div>

        ${results?.recommendations && results.recommendations.length > 0 ? `
        <div class="section">
            <div class="section-title">Recommendations</div>
            ${results.recommendations.map(rec => `
                <div class="recommendation">${rec}</div>
            `).join('')}
        </div>
        ` : ''}

        <div class="disclaimer">
            <strong>⚠️ Important Notice:</strong><br>
            This AI analysis is for screening purposes only and should not be used as a substitute for professional medical diagnosis. 
            Please consult with a qualified eye care professional for proper diagnosis and treatment.
        </div>

        <div class="footer">
            <div>Generated by OptiScan AI Eye Analysis System</div>
            <div>Report generated on ${currentDate} at ${currentTime}</div>
            <div>© ${new Date().getFullYear()} OptiScan. All rights reserved.</div>
        </div>
    </body>
    </html>
    `;
  };

  // Generate and share PDF using Expo Print
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Generate HTML content
      const htmlContent = generateHTMLContent();

      // Create PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
        base64: false
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the PDF
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share your OptiScan Report'
        });
        
        Alert.alert(
          'PDF Generated Successfully',
          'Your report has been generated and is ready to share!',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback: just show success message
        Alert.alert(
          'PDF Generated Successfully',
          `Report created successfully at: ${uri}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('PDF generation failed:', error);
      Alert.alert(
        'PDF Generation Failed',
        'Unable to generate PDF report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Share as text (alternative option)
  const shareAsText = async () => {
    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      const results = scanData.results;
      const finalPrediction = results?.final_prediction || {};
      
      const textReport = `
OptiScan AI Eye Analysis Report
==============================

Patient Information:
- Name: ${scanData.userInfo?.username || 'Anonymous'}
- Age: ${scanData.age} years
- Gender: ${scanData.gender || 'Not specified'}
- Email: ${scanData.userInfo?.email || 'Not provided'}
- Scan Date: ${new Date(scanData.timestamp).toLocaleDateString()} at ${new Date(scanData.timestamp).toLocaleTimeString()}
- Scan ID: ${scanData.scanId || 'N/A'}

AI Analysis Results:
- Primary Diagnosis: ${formatConditionName(finalPrediction.condition)}
- Confidence: ${finalPrediction.confidence?.toFixed(1) || 0}%
- Risk Level: ${finalPrediction.risk_level?.toUpperCase() || 'LOW'}

Left Eye Results:
${Object.entries(results?.left_eye || {}).map(([condition, probability]) => 
  `- ${formatConditionName(condition)}: ${(probability * 100).toFixed(1)}%`
).join('\n')}

Right Eye Results:
${Object.entries(results?.right_eye || {}).map(([condition, probability]) => 
  `- ${formatConditionName(condition)}: ${(probability * 100).toFixed(1)}%`
).join('\n')}

Combined Analysis:
${Object.entries(results?.combined || {}).map(([condition, probability]) => 
  `- ${formatConditionName(condition)}: ${(probability * 100).toFixed(1)}%`
).join('\n')}

${results?.recommendations && results.recommendations.length > 0 ? `
Recommendations:
${results.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

Important Notice:
This AI analysis is for screening purposes only. Please consult with a qualified eye care professional for proper diagnosis and treatment.

Generated by OptiScan AI Eye Analysis System
© ${new Date().getFullYear()} OptiScan. All rights reserved.
      `.trim();

      await Share.share({
        message: textReport,
        title: 'OptiScan Eye Analysis Report'
      });

    } catch (error) {
      console.error('Text sharing failed:', error);
      Alert.alert('Sharing Failed', 'Unable to share report as text.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading scan results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !scanData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'No scan data available'}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const results = scanData.results;
  const finalPrediction = results?.final_prediction || {};

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        {/* Simple Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconButton icon="arrow-left" size={24} iconColor="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Results</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView}>
          {/* Patient Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Patient Information</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Name: {scanData.userInfo?.username || 'Anonymous'}</Text>
                <Text style={styles.infoText}>Age: {scanData.age} years</Text>
                <Text style={styles.infoText}>Gender: {scanData.gender || 'Not specified'}</Text>
                <Text style={styles.infoText}>Date: {new Date(scanData.timestamp).toLocaleDateString()}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Main Result */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Primary Diagnosis</Text>
              <View style={styles.resultContainer}>
                <Text style={[styles.conditionName, { color: getConditionColor(finalPrediction.condition) }]}>
                  {formatConditionName(finalPrediction.condition)}
                </Text>
                <Text style={styles.confidenceText}>
                  Confidence: {finalPrediction.confidence?.toFixed(1) || 0}%
                </Text>
                <Chip 
                  style={[styles.riskChip, { backgroundColor: getConditionColor(finalPrediction.condition) }]}
                  textStyle={styles.riskText}
                >
                  {finalPrediction.risk_level?.toUpperCase() || 'LOW'} RISK
                </Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Eye Images */}
          {(scanData.leftEye || scanData.rightEye) && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Analyzed Images</Text>
                <View style={styles.imagesContainer}>
                  {scanData.leftEye && (
                    <View style={styles.imageContainer}>
                      <Text style={styles.imageLabel}>Left Eye</Text>
                      <Image source={{ uri: scanData.leftEye }} style={styles.eyeImage} />
                    </View>
                  )}
                  {scanData.rightEye && (
                    <View style={styles.imageContainer}>
                      <Text style={styles.imageLabel}>Right Eye</Text>
                      <Image source={{ uri: scanData.rightEye }} style={styles.eyeImage} />
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Left Eye Results */}
          {Object.keys(results?.left_eye || {}).length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Left Eye Analysis</Text>
                {Object.entries(results.left_eye).map(([condition, probability]) => (
                  <View key={condition} style={styles.resultRow}>
                    <Text style={styles.conditionText}>{formatConditionName(condition)}</Text>
                    <Text style={styles.probabilityText}>{(probability * 100).toFixed(1)}%</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Right Eye Results */}
          {Object.keys(results?.right_eye || {}).length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Right Eye Analysis</Text>
                {Object.entries(results.right_eye).map(([condition, probability]) => (
                  <View key={condition} style={styles.resultRow}>
                    <Text style={styles.conditionText}>{formatConditionName(condition)}</Text>
                    <Text style={styles.probabilityText}>{(probability * 100).toFixed(1)}%</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Combined Results */}
          {Object.keys(results?.combined || {}).length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Combined Analysis</Text>
                {Object.entries(results.combined).map(([condition, probability]) => (
                  <View key={condition} style={styles.resultRow}>
                    <Text style={styles.conditionText}>{formatConditionName(condition)}</Text>
                    <Text style={styles.probabilityText}>{(probability * 100).toFixed(1)}%</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Recommendations */}
          {results?.recommendations && results.recommendations.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Recommendations</Text>
                {results.recommendations.map((recommendation, index) => (
                  <Text key={index} style={styles.recommendationText}>
                    • {recommendation}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Overall Assessment */}
          {results?.overall_assessment && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Clinical Assessment</Text>
                <Text style={styles.assessmentText}>{results.overall_assessment}</Text>
              </Card.Content>
            </Card>
          )}

          {/* Disclaimer */}
          <Card style={[styles.card, styles.disclaimerCard]}>
            <Card.Content>
              <Text style={styles.disclaimerTitle}>Important Notice</Text>
              <Text style={styles.disclaimerText}>
                This AI analysis is for screening purposes only. Please consult with a qualified 
                eye care professional for proper diagnosis and treatment.
              </Text>
            </Card.Content>
          </Card>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={generatePDF}
            style={[styles.shareButton, { marginBottom: 10 }]}
            loading={isGeneratingPDF}
            disabled={isGeneratingPDF}
            icon="file-pdf-box"
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF Report'}
          </Button>
          <Button
            mode="outlined"
            onPress={shareAsText}
            style={styles.shareButton}
            icon="share"
          >
            Share as Text
          </Button>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#007BFF',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#495057',
  },
  card: {
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
  },
  infoContainer: {
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#495057',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
  },
  conditionName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 18,
    color: '#28A745',
    marginBottom: 15,
  },
  riskChip: {
    paddingHorizontal: 20,
  },
  riskText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
  },
  eyeImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DEE2E6',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  conditionText: {
    fontSize: 16,
    color: '#495057',
  },
  probabilityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  recommendationText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
    lineHeight: 20,
  },
  assessmentText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  disclaimerCard: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
  },
  shareButton: {
    borderRadius: 25,
    paddingVertical: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#DC3545',
    marginBottom: 20,
    textAlign: 'center',
  },
});