import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  Snackbar,
  Provider as PaperProvider,
  DefaultTheme,
  Menu,
  TouchableRipple,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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

export default function Register({ navigation }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: '',
    gender: '',
    password: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Updated image picker
  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showSnackbar('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      setImage(selectedImageUri);
    }
  };

  const validateForm = () => {
    const { username, email, age, gender, password } = formData;
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const ageNumber = parseInt(age);
      if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 150) {
        newErrors.age = 'Please enter a valid age (1-150)';
      }
    }

    if (!gender) {
      newErrors.gender = 'Please select a gender';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('password', formData.password);

      // Updated image handling
      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formDataToSend.append('img', {
          uri: image,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const apiURL = `${baseURL}/api/users/register`;
      console.log('🚀 Sending registration request to:', apiURL);

      // Axios POST request
      const response = await axios.post(apiURL, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('✅ Registration response:', response.data);

      // Success response
      showSnackbar('Registration successful!');
      
      // Clear form
      setFormData({
        username: '',
        email: '',
        age: '',
        gender: '',
        password: '',
      });
      setImage(null);
      
      // Navigate to login after delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);

    } catch (error) {
      console.error('❌ Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid input data. Please check your information.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = 'An unexpected error occurred.';
      }

      showSnackbar(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Header */}
            <LinearGradient
              colors={['#1e3a8a', '#3b82f6']}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>Join OptiScan today</Text>
            </LinearGradient>

            {/* Form Container */}
            <Surface style={styles.formContainer} elevation={4}>
              <Text variant="headlineMedium" style={styles.formTitle}>
                Sign Up
              </Text>
              <Text variant="bodyLarge" style={styles.formSubtitle}>
                Create your OptiScan account
              </Text>

              {/* Profile Image Section */}
              <View style={styles.imageSection}>
                <Button
                  mode="contained"
                  onPress={pickImage}
                  icon="camera"
                  style={styles.imagePicker}
                  contentStyle={styles.imagePickerContent}
                >
                  Upload Profile Picture
                </Button>
                
                {image && (
                  <View style={styles.imagePreviewContainer}>
                    <Text variant="bodyMedium" style={styles.imageText}>
                      Image selected
                    </Text>
                    <Image
                      source={{ uri: image }}
                      style={styles.profileImage}
                    />
                  </View>
                )}
              </View>

              {/* Username Input */}
              <TextInput
                label="Username"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                mode="outlined"
                autoCapitalize="none"
                error={!!errors.username}
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
              />
              {errors.username && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.username}
                </Text>
              )}

              {/* Email Input */}
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.email}
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />
              {errors.email && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.email}
                </Text>
              )}

              {/* Age Input */}
              <TextInput
                label="Age"
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.age}
                style={styles.input}
                left={<TextInput.Icon icon="calendar" />}
              />
              {errors.age && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.age}
                </Text>
              )}

              {/* Gender Selector */}
              <Menu
                visible={genderMenuVisible}
                onDismiss={() => setGenderMenuVisible(false)}
                anchor={
                  <TextInput
                    label="Gender"
                    value={formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : ''}
                    mode="outlined"
                    editable={false}
                    error={!!errors.gender}
                    style={styles.input}
                    left={<TextInput.Icon icon="human-male-female" />}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setGenderMenuVisible(true)} />}
                    onPressIn={() => setGenderMenuVisible(true)}
                  />
                }
              >
                <Menu.Item onPress={() => { handleInputChange('gender', 'male'); setGenderMenuVisible(false); }} title="Male" />
                <Menu.Item onPress={() => { handleInputChange('gender', 'female'); setGenderMenuVisible(false); }} title="Female" />
                <Menu.Item onPress={() => { handleInputChange('gender', 'other'); setGenderMenuVisible(false); }} title="Other" />
              </Menu>
              {errors.gender && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.gender}
                </Text>
              )}

              {/* Password Input */}
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.password}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
              />
              {errors.password && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.password}
                </Text>
              )}

              {/* Register Button */}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
                contentStyle={styles.registerButtonContent}
                labelStyle={styles.registerButtonText}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text variant="bodyMedium" style={styles.loginText}>
                  Already have an account?
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => navigation.navigate('Login')}
                  labelStyle={styles.loginLink}
                >
                  Sign In
                </Button>
              </View>
            </Surface>
          </ScrollView>

          {/* Snackbar */}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.snackbar}
          >
            {snackbarMessage}
          </Snackbar>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0f2fe',
  },
  formContainer: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  formTitle: {
    textAlign: 'center',
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formSubtitle: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 30,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  imagePicker: {
    borderRadius: 25,
    marginBottom: 15,
  },
  imagePickerContent: {
    height: 50,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  imageText: {
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  input: {
    marginBottom: 10,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 15,
    marginLeft: 5,
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 28,
  },
  registerButtonContent: {
    height: 50,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#64748b',
  },
  loginLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  snackbar: {
    margin: 16,
  },
});