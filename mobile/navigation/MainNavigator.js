import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  Provider as PaperProvider,
  DefaultTheme,
} from 'react-native-paper';

// Import your components
import LandingPage from '../components/LandingPage';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import Home from '../components/Home/Home';
import EyeScan from '../components/Home/Eye_Scan';

const Stack = createNativeStackNavigator();

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    accent: '#1d4ed8',
  },
};

// Main Stack Navigator
export default function MainNavigator() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen 
            name="Landing" 
            component={LandingPage}
          />
          <Stack.Screen 
            name="Login" 
            component={Login}
          />
          <Stack.Screen 
            name="Register" 
            component={Register}
          />

          {/* Main App */}
          <Stack.Screen 
            name="Home" 
            component={Home}
          />  
          <Stack.Screen 
            name="EyeScan" 
            component={EyeScan}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}