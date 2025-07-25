import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  Card,
  Button,
  TextInput,
  Chip,
  Provider as PaperProvider,
  DefaultTheme,
  IconButton,
  ProgressBar,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseURL';

const { width, height } = Dimensions.get('window');

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    accent: '#1d4ed8',
  },
};

export default function Eye_Scan({ navigation }) {
  const [leftEyeImage, setLeftEyeImage] = useState(null);
  const [rightEyeImage, setRightEyeImage] = useState(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState('checking');
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Check model status and fetch user info on component mount
  useEffect(() => {
    checkModelStatus();
    loadUserFromStorage();
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/eye-scan/health`);
      
      if (response.data.ai_models_loaded > 0) {
        setModelStatus('ready');
      } else {
        setModelStatus('error');
      }
    } catch (error) {
      console.error('Failed to check model status:', error);
      setModelStatus('error');
    }
  };

  // Load user information from AsyncStorage
  const loadUserFromStorage = async () => {
    try {
      setIsLoadingUser(true);
      
      // Get the stored login response
      const storedData = await AsyncStorage.getItem('loginResponse');
      
      if (storedData) {
        const loginData = JSON.parse(storedData);
        const user = loginData.user;
        
        if (user) {
          setUserInfo(user);
          
          // Auto-fill user data from AsyncStorage
          if (user.age) {
            setAge(user.age.toString());
          }
          if (user.gender) {
            setGender(user.gender.toLowerCase());
          }
          
          console.log('✅ User info loaded from storage:', user.username);
          console.log('📋 User details:', {
            username: user.username,
            age: user.age,
            gender: user.gender,
            email: user.email
          });
        }
      } else {
        console.log('❌ No login data found in storage');
        // If no login data, try to get user info separately
        const userInfoData = await AsyncStorage.getItem('userInfo');
        if (userInfoData) {
          const user = JSON.parse(userInfoData);
          setUserInfo(user);
          if (user.age) setAge(user.age.toString());
          if (user.gender) setGender(user.gender.toLowerCase());
        }
      }
    } catch (error) {
      console.error('❌ Error loading user info from storage:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Convert image to base64
  const convertToBase64 = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Base64 conversion failed:', error);
      throw error;
    }
  };

  // Get authentication token from AsyncStorage
  const getAuthToken = async () => {
    try {
      // First try to get from loginResponse
      const loginResponse = await AsyncStorage.getItem('loginResponse');
      if (loginResponse) {
        const loginData = JSON.parse(loginResponse);
        if (loginData.access_token) {
          console.log('🔑 Token retrieved from loginResponse');
          return loginData.access_token;
        }
      }
      
      // Fallback to authToken key
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        console.log('🔑 Token retrieved from authToken');
        return token;
      }
      
      throw new Error('No authentication token found. Please login again.');
    } catch (error) {
      console.error('❌ Auth token error:', error);
      throw new Error('Authentication required. Please login again.');
    }
  };

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to capture eye images for analysis.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Image picker
  const showImagePicker = (eyeType) => {
    Alert.alert(
      'Select Image',
      'Choose how to capture the eye image',
      [
        {
          text: 'Camera',
          onPress: () => pickImage(eyeType, 'camera'),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage(eyeType, 'gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (eyeType, source) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    };

    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (eyeType === 'left') {
        setLeftEyeImage(imageUri);
      } else {
        setRightEyeImage(imageUri);
      }
    }
  };

  const removeImage = (eyeType) => {
    if (eyeType === 'left') {
      setLeftEyeImage(null);
    } else {
      setRightEyeImage(null);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];
    
    if (!leftEyeImage) errors.push('Left eye image is required');
    if (!rightEyeImage) errors.push('Right eye image is required');
    if (!age || isNaN(age) || age < 1 || age > 120) {
      errors.push('Valid age (1-120) is required');
    }
    if (!gender) errors.push('Gender selection is required');
    if (modelStatus !== 'ready') errors.push('AI model is not ready');

    return errors;
  };

  // Submit scan for AI analysis
  // Update the handleSubmitScan function in your Eye_Scan.js file
// Replace the existing handleSubmitScan function with this updated version:

const handleSubmitScan = async () => {
  const errors = validateForm();
  
  if (errors.length > 0) {
    Alert.alert('Validation Error', errors.join('\n'));
    return;
  }

  setIsProcessing(true);
  setUploadProgress(0);

  try {
    // Get auth token from AsyncStorage
    setUploadProgress(10);
    const authToken = await getAuthToken();
    console.log('🔐 Using auth token for API request');

    // Convert images to base64
    setUploadProgress(30);
    console.log('🖼️ Converting left eye image to base64...');
    const leftEyeBase64 = await convertToBase64(leftEyeImage);
    
    setUploadProgress(50);
    console.log('🖼️ Converting right eye image to base64...');
    const rightEyeBase64 = await convertToBase64(rightEyeImage);

    // Prepare request with user data from AsyncStorage
    setUploadProgress(70);
    const requestData = {
      left_eye_image: leftEyeBase64,
      right_eye_image: rightEyeBase64,
      age: parseInt(age),
      gender: gender
    };

    console.log('📤 Sending analysis request with data:', {
      age: requestData.age,
      gender: requestData.gender,
      hasLeftImage: !!requestData.left_eye_image,
      hasRightImage: !!requestData.right_eye_image
    });

    // Send to AI backend using axios
    setUploadProgress(85);
    const response = await axios.post(
      `${baseURL}/api/eye-scan/analyze`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    setUploadProgress(100);
    const analysisResults = response.data;
    console.log('✅ Analysis completed successfully:', analysisResults);

    // Show success and navigate with properly structured data
    const userName = userInfo?.username || 'User';
    Alert.alert(
      'Analysis Complete',
      `Hello ${userName}! 👋\n\nAI has analyzed your eye images for:\n• Diabetic Retinopathy\n• Glaucoma\n• Cataract\n• Normal Condition\n\nResults are ready for review.`,
      [
        {
          text: 'View Results',
          onPress: () => {
            // Navigate with data structured for EyeScanResults.js
            navigation.navigate('EyeScanResults', {
              scanData: {
                scanId: analysisResults.scan_id,
                leftEye: leftEyeImage,
                rightEye: rightEyeImage,
                age: parseInt(age),
                gender: gender,
                timestamp: analysisResults.timestamp || new Date().toISOString(),
                userInfo: {
                  username: analysisResults.user_info?.username || userInfo?.username || 'Anonymous',
                  email: analysisResults.user_info?.email || userInfo?.email || '',
                  age: analysisResults.user_info?.age || userInfo?.age || parseInt(age),
                  gender: analysisResults.user_info?.gender || userInfo?.gender || gender
                },
                results: {
                  left_eye: analysisResults.left_eye || {},
                  right_eye: analysisResults.right_eye || {},
                  combined: analysisResults.combined || {},
                  final_prediction: {
                    condition: analysisResults.final_prediction?.condition || 'unknown',
                    confidence: analysisResults.final_prediction?.confidence || 0,
                    risk_level: analysisResults.final_prediction?.risk_level || 'low'
                  },
                  recommendations: analysisResults.recommendations || ['Please consult with an eye care professional for further evaluation.'],
                  overall_assessment: analysisResults.overall_assessment || 'Analysis completed'
                }
              }
            });
          }
        }
      ]
    );

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    let errorMessage = 'Failed to analyze images. Please try again.';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
        // Navigate to login if auth fails
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else if (error.response.data?.detail) {
        errorMessage = error.response.data.detail;
      }
    } else if (error.message.includes('Authentication required')) {
      errorMessage = 'Please login to continue with the analysis.';
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    }
    
    Alert.alert('Analysis Failed', errorMessage);
  } finally {
    setIsProcessing(false);
    setUploadProgress(0);
  }
};

  // Render model status indicator
  const renderModelStatus = () => {
    let statusColor, statusText, statusIcon;
    
    switch (modelStatus) {
      case 'ready':
        statusColor = '#10b981';
        statusText = 'AI Model Ready';
        statusIcon = 'check-circle';
        break;
      case 'error':
        statusColor = '#ef4444';
        statusText = 'AI Model Error';
        statusIcon = 'alert-circle';
        break;
      default:
        statusColor = '#f59e0b';
        statusText = 'Checking AI Model...';
        statusIcon = 'clock';
    }

    return (
      <Card style={[styles.statusCard, { borderLeftColor: statusColor }]} elevation={1}>
        <Card.Content>
          <View style={styles.statusContent}>
            <IconButton icon={statusIcon} iconColor={statusColor} size={20} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
          {modelStatus === 'ready' && (
            <Text style={styles.statusSubtext}>
              Detects: Normal, Diabetic Retinopathy, Glaucoma, Cataract
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render user welcome card
  const renderUserWelcome = () => {
    if (isLoadingUser) {
      return (
        <Card style={styles.userCard} elevation={1}>
          <Card.Content>
            <View style={styles.userContent}>
              <IconButton icon="account-circle" iconColor="#3b82f6" size={24} />
              <Text style={styles.userText}>Loading user info...</Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    if (userInfo) {
      return (
        <Card style={styles.userCard} elevation={1}>
          <Card.Content>
            <View style={styles.userContent}>
              <IconButton icon="account-circle" iconColor="#3b82f6" size={24} />
              <View style={styles.userTextContainer}>
                <Text style={styles.userWelcome}>
                  Welcome, {userInfo.username}! 👋
                </Text>
                <Text style={styles.userSubtext}>
                  {userInfo.email} • Age: {userInfo.age || 'Not set'} • Gender: {userInfo.gender || 'Not set'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return null;
  };

  // Render image upload card
  const renderImageUpload = (eyeType, imageUri, title) => (
    <Card style={styles.imageCard} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          {title}
        </Text>
        
        <View style={styles.imageContainer}>
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.eyeImage} />
              <View style={styles.imageOverlay}>
                <IconButton
                  icon="close-circle"
                  size={30}
                  iconColor="#ffffff"
                  style={styles.removeButton}
                  onPress={() => removeImage(eyeType)}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadPlaceholder}
              onPress={() => showImagePicker(eyeType)}
              disabled={modelStatus !== 'ready'}
            >
              <IconButton
                icon="camera-plus"
                size={40}
                iconColor={modelStatus === 'ready' ? "#3b82f6" : "#9ca3af"}
              />
              <Text style={[
                styles.uploadText, 
                { color: modelStatus === 'ready' ? "#3b82f6" : "#9ca3af" }
              ]}>
                Tap to capture {title.toLowerCase()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {imageUri && (
          <Button
            mode="outlined"
            onPress={() => showImagePicker(eyeType)}
            style={styles.changeImageButton}
            icon="image-edit"
            disabled={modelStatus !== 'ready'}
          >
            Change Image
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor="#ffffff"
              />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <View style={styles.eyeIcon}>
                <View style={styles.eyeOuter}>
                  <View style={styles.eyeInner}>
                    <View style={styles.pupil} />
                  </View>
                </View>
              </View>
              <Text style={styles.headerTitle}>AI Eye Analysis</Text>
              <Text style={styles.headerSubtitle}>
                4-condition detection system
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Welcome */}
          {renderUserWelcome()}

          {/* Model Status */}
          {renderModelStatus()}

          {/* Instructions */}
          <Card style={styles.instructionCard} elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.instructionTitle}>
                🔬 AI Analysis Information
              </Text>
              <Text style={styles.instructionText}>
                • Our AI model analyzes for 4 conditions{'\n'}
                • Normal eye, Diabetic Retinopathy, Glaucoma, Cataract{'\n'}
                • Take clear, well-lit photos centered on the eye{'\n'}
                • Remove contact lenses for best results{'\n'}
                • Results based on medical research studies{'\n'}
                • For screening only - not a medical diagnosis
              </Text>
            </Card.Content>
          </Card>

          {/* Image Uploads */}
          <View style={styles.imagesSection}>
            {renderImageUpload('left', leftEyeImage, 'Left Eye')}
            {renderImageUpload('right', rightEyeImage, 'Right Eye')}
          </View>

          {/* Patient Information */}
          <Card style={styles.patientInfoCard} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Patient Information
              </Text>

              <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                placeholder={userInfo?.age ? `From profile: ${userInfo.age}` : "Enter age (1-120)"}
                disabled={modelStatus !== 'ready'}
              />

              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.genderSelected
                    ]}
                    onPress={() => setGender(option)}
                    disabled={modelStatus !== 'ready'}
                  >
                    <RadioButton
                      value={option}
                      status={gender === option ? 'checked' : 'unchecked'}
                      onPress={() => setGender(option)}
                      disabled={modelStatus !== 'ready'}
                    />
                    <Text style={styles.genderText}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                      {userInfo?.gender?.toLowerCase() === option && ' (From Profile)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Progress */}
          {isProcessing && (
            <Card style={styles.progressCard} elevation={1}>
              <Card.Content>
                <Text style={styles.progressText}>
                  AI Analysis in Progress... {uploadProgress}%
                </Text>
                <ProgressBar
                  progress={uploadProgress / 100}
                  color="#3b82f6"
                  style={styles.progressBar}
                />
                <Text style={styles.progressSubtext}>
                  {uploadProgress < 40 ? 'Preparing images...' : 
                   uploadProgress < 80 ? 'Running AI analysis...' : 
                   'Generating results...'}
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* Submit Button */}
        <Surface style={styles.submitContainer} elevation={4}>
          <Button
            mode="contained"
            onPress={handleSubmitScan}
            style={[
              styles.submitButton,
              { opacity: modelStatus === 'ready' ? 1 : 0.5 }
            ]}
            contentStyle={styles.submitContent}
            disabled={isProcessing || modelStatus !== 'ready'}
            loading={isProcessing}
            icon="brain"
          >
            {isProcessing ? 'Analyzing...' : 
             modelStatus !== 'ready' ? 'AI Model Loading...' : 
             'Start AI Analysis'}
          </Button>
        </Surface>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  // All existing styles remain the same...
  statusCard: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
    marginLeft: 35,
  },
  
  // New user welcome card styles
  userCard: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: 5,
    flex: 1,
  },
  userWelcome: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e40af',
  },
  userText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 10,
  },
  userSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  
  // Continue with all your existing styles...
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: height * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  eyeIcon: {
    marginBottom: 10,
  },
  eyeOuter: {
    width: 50,
    height: 35,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  eyeInner: {
    width: 38,
    height: 24,
    backgroundColor: '#e0f2fe',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 12,
    height: 12,
    backgroundColor: '#1e3a8a',
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0f2fe',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  instructionCard: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  instructionTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#64748b',
    lineHeight: 20,
  },
  imagesSection: {
    marginBottom: 20,
  },
  imageCard: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imageContainer: {
    marginBottom: 15,
  },
  imageWrapper: {
    position: 'relative',
  },
  eyeImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  removeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 0,
  },
  uploadPlaceholder: {
    height: 200,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  uploadText: {
    fontSize: 14,
    marginTop: 10,
  },
  changeImageButton: {
    borderColor: '#3b82f6',
  },
  patientInfoCard: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  input: {
    marginBottom: 15,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  genderSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  genderText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#374151',
  },
  progressCard: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  progressSubtext: {
    textAlign: 'center',
    marginTop: 5,
    color: '#64748b',
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
  },
  submitButton: {
    borderRadius: 25,
  },
  submitContent: {
    height: 50,
  },
});