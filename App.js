import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './context/AuthContext';

import AdminScreen from './screens/AdminScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import TestScreen from './screens/TestScreen'; 
import AssessmentScreen from './screens/AssessmentScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import GamesScreen from './screens/GamesScreen';
import JournalScreen from './screens/JournalScreen';
import SkribbleArtScreen from './screens/SkribbleArtScreen';
import BreathingExerciseScreen from './screens/BreathingExerciseScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReportScreen from './screens/ReportScreen';
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color="#5a7a5a"/></View>;
  }

  return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
              </>
          ) : !user.hasCompletedOnboarding ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : !user.hasCompletedAssessment ? (
              <>
                <Stack.Screen name="Test" component={TestScreen} />
                <Stack.Screen name="Assessment" component={AssessmentScreen} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
              </>
          ) : (
              <>
                {/* Main App Stack */}
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="Games" component={GamesScreen} />
                <Stack.Screen name="Journal" component={JournalScreen} />
                <Stack.Screen name="Admin" component={AdminScreen} />
                <Stack.Screen name="Art" component={SkribbleArtScreen} />
                <Stack.Screen name="Breathing" component={BreathingExerciseScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Report" component={ReportScreen} />
                {/* 🔥 FIX: Both Test AND Assessment are registered here so the user can retake it! */}
                <Stack.Screen name="Test" component={TestScreen} />
                <Stack.Screen name="Assessment" component={AssessmentScreen} />
              </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default function App() {
  return (
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
  );
}