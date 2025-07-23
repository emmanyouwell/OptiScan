import React, { useState } from 'react';
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

  // Request camera/gallery permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload eye images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Image picker options
  const showImagePicker = (eyeType) => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select an eye image',
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
      ],
      { cancelable: true }
    );
  };

  // Pick image from camera or gallery
  const pickImage = async (eyeType, source) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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

  // Remove image
  const removeImage = (eyeType) => {
    if (eyeType === 'left') {
      setLeftEyeImage(null);
    } else {
      setRightEyeImage(null);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = [];
    
    if (!leftEyeImage) errors.push('Left eye image is required');
    if (!rightEyeImage) errors.push('Right eye image is required');
    if (!age || isNaN(age) || age < 1 || age > 120) {
      errors.push('Please enter a valid age (1-120)');
    }
    if (!gender) errors.push('Please select a gender');

    return errors;
  };

  // Submit scan
  const handleSubmitScan = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success and navigate to results
      Alert.alert(
        'Scan Submitted',
        'Your eye scan has been submitted successfully. Processing results...',
        [
          {
            text: 'View Results',
            onPress: () => {
              // Navigate to results screen or show results
              console.log('Navigate to results with data:', {
                leftEye: leftEyeImage,
                rightEye: rightEyeImage,
                age,
                gender
              });
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to submit scan. Please try again.');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
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
            >
              <IconButton
                icon="camera-plus"
                size={40}
                iconColor="#3b82f6"
              />
              <Text style={styles.uploadText}>Tap to upload {title.toLowerCase()}</Text>
            </TouchableOpacity>
          )}
        </View>

        {imageUri && (
          <Button
            mode="outlined"
            onPress={() => showImagePicker(eyeType)}
            style={styles.changeImageButton}
            icon="image-edit"
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
              <Text style={styles.headerTitle}>Eye Scan</Text>
              <Text style={styles.headerSubtitle}>Upload images for analysis</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions */}
          <Card style={styles.instructionCard} elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.instructionTitle}>
                📋 Instructions
              </Text>
              <Text style={styles.instructionText}>
                • Take clear, well-lit photos of both eyes{'\n'}
                • Ensure the eye is centered and in focus{'\n'}
                • Remove contact lenses if possible{'\n'}
                • Use natural lighting for best results
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

              {/* Age Input */}
              <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                placeholder="Enter your age"
              />

              {/* Gender Selection */}
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    gender === 'male' && styles.genderSelected
                  ]}
                  onPress={() => setGender('male')}
                >
                  <RadioButton
                    value="male"
                    status={gender === 'male' ? 'checked' : 'unchecked'}
                    onPress={() => setGender('male')}
                  />
                  <Text style={styles.genderText}>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    gender === 'female' && styles.genderSelected
                  ]}
                  onPress={() => setGender('female')}
                >
                  <RadioButton
                    value="female"
                    status={gender === 'female' ? 'checked' : 'unchecked'}
                    onPress={() => setGender('female')}
                  />
                  <Text style={styles.genderText}>Female</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    gender === 'other' && styles.genderSelected
                  ]}
                  onPress={() => setGender('other')}
                >
                  <RadioButton
                    value="other"
                    status={gender === 'other' ? 'checked' : 'unchecked'}
                    onPress={() => setGender('other')}
                  />
                  <Text style={styles.genderText}>Other</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* Progress Bar */}
          {isProcessing && (
            <Card style={styles.progressCard} elevation={1}>
              <Card.Content>
                <Text style={styles.progressText}>
                  Processing scan... {uploadProgress}%
                </Text>
                <ProgressBar
                  progress={uploadProgress / 100}
                  color="#3b82f6"
                  style={styles.progressBar}
                />
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* Submit Button */}
        <Surface style={styles.submitContainer} elevation={4}>
          <Button
            mode="contained"
            onPress={handleSubmitScan}
            style={styles.submitButton}
            contentStyle={styles.submitContent}
            disabled={isProcessing}
            loading={isProcessing}
            icon="eye-check"
          >
            {isProcessing ? 'Processing...' : 'Analyze Eyes'}
          </Button>
        </Surface>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
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
    color: '#3b82f6',
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