import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthContext } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// Using your Web Client ID across all platforms for testing
const WEB_CLIENT_ID     = '1040164530649-jjt41i94p2othlrk3vclgr2623vf5lve.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '1040164530649-jjt41i94p2othlrk3vclgr2623vf5lve.apps.googleusercontent.com'; 
const IOS_CLIENT_ID     = '1040164530649-jjt41i94p2othlrk3vclgr2623vf5lve.apps.googleusercontent.com'; 

export default function LoginScreen({ navigation }) {
  const { loginWithGoogle } = useContext(AuthContext);

  // CRITICAL FIX: Changed from useAuthRequest to useIdTokenAuthRequest
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:        WEB_CLIENT_ID, // Added as a fallback
    webClientId:     WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId:     IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      // Because we used useIdTokenAuthRequest, params.id_token will now exist!
      const token = response.params?.id_token;
      
      if (token) {
        loginWithGoogle(token);
      } else {
        alert("Still no ID token. Check console.");
        console.log("FULL GOOGLE RESPONSE:", response);
      }
    } else if (response?.type === 'error') {
       alert("Google Auth failed. Check console.");
       console.log("GOOGLE ERROR:", response.error);
    }
  }, [response]);

  return (
    <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Let's get started on your journey.</Text>
        <TouchableOpacity
          style={[styles.submitButton, !request && styles.disabled]}
          disabled={!request}
          onPress={() => promptAsync()} 
        >
          <Text style={styles.submitText}>Continue with Google →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 32, fontFamily: 'serif', marginBottom: 10, color: '#1c1917' },
  subtitle: { fontSize: 16, color: '#78716c', marginBottom: 40 },
  submitButton: { backgroundColor: '#8a9a7b', borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});