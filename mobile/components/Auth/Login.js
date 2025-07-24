import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  IconButton,
  Snackbar,
  ActivityIndicator,
  Provider as PaperProvider,
  DefaultTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function Login({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const { email, password } = formData;
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create FormData for login
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);

      const apiURL = `${baseURL}/api/users/login`;
      console.log('🚀 Sending login request to:', apiURL);

      // Axios POST request
      const response = await axios.post(apiURL, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('✅ Login response:', response.data);

      if (response.data.access_token) {
        // Store auth token
        await AsyncStorage.setItem('authToken', response.data.access_token);
        
        // Store complete login response for user info
        await AsyncStorage.setItem('loginResponse', JSON.stringify(response.data));
        
        // Also store user info separately for easy access
        if (response.data.user) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));
          
          console.log('✅ Stored user info:', {
            username: response.data.user.username,
            email: response.data.user.email,
            age: response.data.user.age,
            gender: response.data.user.gender
          });
        }
        
        showSnackbar(`Welcome back, ${response.data.user?.username || 'User'}!`);
        
        // Clear form
        setFormData({
          email: '',
          password: '',
        });
        
        // Navigate after a short delay
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1500);
      } else {
        showSnackbar('Invalid response from server');
      }

    } catch (error) {
      console.error('❌ Login error:', error);

      let errorMessage = 'Login failed. Please try again.';

      if (error.response) {
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid input data. Please check your credentials.';
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
              <View style={styles.logoContainer}>
                {/* Eye Icon */}
                <View style={styles.eyeIcon}>
                  <View style={styles.eyeOuter}>
                    <View style={styles.eyeInner}>
                      <View style={styles.pupil} />
                    </View>
                  </View>
                </View>
                <Text style={styles.logoText}>OptiScan</Text>
                <Text style={styles.headerSubtitle}>Welcome back!</Text>
              </View>
            </LinearGradient>

            {/* Form Container */}
            <Surface style={styles.formContainer} elevation={4}>
              <Text variant="headlineMedium" style={styles.formTitle}>
                Sign In
              </Text>
              <Text variant="bodyLarge" style={styles.formSubtitle}>
                Enter your credentials to continue
              </Text>

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

              {/* Password Input */}
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.password}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {errors.password && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.password}
                </Text>
              )}

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                labelStyle={styles.loginButtonText}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Register Link */}
              <View style={styles.registerSection}>
                <Text variant="bodyMedium" style={styles.registerText}>
                  Don't have an account?
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => navigation.navigate('Register')}
                  labelStyle={styles.registerLink}
                >
                  Create Account
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
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  eyeIcon: {
    marginBottom: 15,
  },
  eyeOuter: {
    width: 80,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  eyeInner: {
    width: 60,
    height: 35,
    backgroundColor: '#e0f2fe',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 20,
    height: 20,
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
  },
  logoText: {
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
  input: {
    marginBottom: 10,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 15,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 20,
    borderRadius: 28,
  },
  loginButtonContent: {
    height: 50,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#64748b',
  },
  registerLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  snackbar: {
    margin: 16,
  },
});