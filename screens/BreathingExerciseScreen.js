import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

export default function BreathingExerciseScreen({ navigation }) {
  const [status, setStatus] = useState('Inhale');
  const [timer, setTimer] = useState(10);
  const [startTime] = useState(Date.now());
  
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          setStatus((prevStatus) => (prevStatus === 'Inhale' ? 'Exhale' : 'Inhale'));
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === 'Inhale') {
      Animated.timing(scaleValue, {
        toValue: 1.5,
        duration: 10000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 10000, 
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const handleExit = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    // Only log if they did it for at least 5 seconds
    if (timeSpent > 5) {
      try {
        await api.post('/wellness/activity', {
          activityType: 'BREATHING_EXERCISE',
          durationSeconds: timeSpent,
          moodBefore: 6, // Generic base value
          moodAfter: 8
        });
      } catch (e) {
        console.log("Failed to log breathing exercise", e);
      }
    }
    
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleExit}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Just</Text>
          <Text style={styles.titleItalic}>breathe</Text>
        </View>
        <Text style={styles.subtitle}>
          Follow the circle's rhythm to center your mind.
        </Text>

        <View style={styles.visualizerContainer}>
          <View style={styles.outerRing} />
          
          <Animated.View 
            style={[
              styles.breathCircle, 
              { transform: [{ scale: scaleValue }] }
            ]} 
          >
            <LinearGradient
              colors={['#8a9a7b', '#5a7a5a']}
              style={styles.gradientCircle}
            />
          </Animated.View>

          <View style={styles.textOverlay}>
            <Text style={styles.statusText}>{status}</Text>
            <Text style={styles.timerText}>{timer}s</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hintText}>Focus on the sensation of air filling your lungs.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 28 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.5)' },
  backArrow: { fontSize: 18, color: '#78716c', marginRight: 4, marginTop: -2 },
  backText: { fontSize: 13, color: '#78716c', fontWeight: '500' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  titleContainer: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 32, color: '#1c1917', fontFamily: 'serif', fontWeight: '300' },
  titleItalic: { fontSize: 32, color: '#5a7a5a', fontFamily: 'serif', fontStyle: 'italic', fontWeight: '300' },
  subtitle: { textAlign: 'center', fontSize: 15, color: '#78716c', lineHeight: 22, marginBottom: 60 },
  visualizerContainer: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center' },
  outerRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: 'rgba(90, 122, 90, 0.1)' },
  breathCircle: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', shadowColor: '#5a7a5a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  gradientCircle: { flex: 1 },
  textOverlay: { position: 'absolute', alignItems: 'center' },
  statusText: { fontSize: 20, fontWeight: '300', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 2 },
  timerText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  footer: { paddingBottom: 60, alignItems: 'center' },
  hintText: { fontSize: 13, color: '#a8a29e', fontStyle: 'italic' },
});