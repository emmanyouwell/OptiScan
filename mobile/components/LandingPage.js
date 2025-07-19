import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  Dimensions
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  Provider as PaperProvider,
  DefaultTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function LandingPage({ navigation }) {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1e3a8a" />
        
        {/* Header Section with Logo */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
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
            <Text style={styles.tagline}>Your Vision, Our Technology</Text>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Welcome Section */}
          <Surface style={styles.welcomeCard} elevation={2}>
            <Text variant="headlineMedium" style={styles.welcomeTitle}>
              Welcome to OptiScan
            </Text>
            <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
              Advanced eye scanning technology for better eye health monitoring
            </Text>
          </Surface>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonText}
              icon="account-plus"
            >
              Create Account
            </Button>

            <Button
              mode="outlined"
              onPress={handleLogin}
              style={styles.secondaryButton}
              contentStyle={styles.secondaryButtonContent}
              labelStyle={styles.secondaryButtonText}
              icon="login"
            >
              Sign In
            </Button>
          </View>

          {/* Bottom Info */}
          <Surface style={styles.bottomCard} elevation={1}>
            <Text variant="bodyMedium" style={styles.bottomText}>
              Join thousands of users monitoring their eye health
            </Text>
          </Surface>
        </View>
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
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  eyeIcon: {
    marginBottom: 20,
  },
  eyeOuter: {
    width: 100,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  eyeInner: {
    width: 75,
    height: 40,
    backgroundColor: '#e0f2fe',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 25,
    height: 25,
    backgroundColor: '#1e3a8a',
    borderRadius: 12.5,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#e0f2fe',
    textAlign: 'center',
    fontWeight: '300',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 30,
  },
  welcomeCard: {
    padding: 25,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  welcomeSubtitle: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonContent: {
    height: 56,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 2,
  },
  secondaryButtonContent: {
    height: 56,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginTop: 20,
  },
  bottomText: {
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});