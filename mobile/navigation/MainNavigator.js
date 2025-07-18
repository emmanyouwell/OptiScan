import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your components
import LandingPage from '../components/LandingPage'; // Updated import
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false, // Hide headers for all screens
        }}
      >
        {/* Landing Page */}
        <Stack.Screen 
          name="Landing" 
          component={LandingPage} // Updated component
        />
        
        {/* Login Screen */}
        <Stack.Screen 
          name="Login" 
          component={Login}
        />
        
        {/* Register Screen */}
        <Stack.Screen 
          name="Register" 
          component={Register}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}