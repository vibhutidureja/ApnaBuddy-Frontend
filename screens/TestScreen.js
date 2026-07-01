import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TestScreen({ navigation }) {
  return (
      <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.iconCircle}>
            <Text style={{fontSize: 40}}>🧠</Text>
          </View>
          <Text style={styles.title}>360° Mental Assessment</Text>
          <Text style={styles.description}>
            A gentle, clinically-informed questionnaire to understand your emotional well-being.
            There are no right or wrong answers.
          </Text>

          <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('Assessment')}
          >
            <Text style={styles.startText}>Begin Assessment →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, inner: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' }, iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(90,122,90,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }, title: { fontSize: 26, fontWeight: 'bold', color: '#1c1917', textAlign: 'center', marginBottom: 15 }, description: { fontSize: 15, color: '#78716c', textAlign: 'center', lineHeight: 22, marginBottom: 40 }, startButton: { width: '100%', backgroundColor: '#8a9a7b', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 15 }, startText: { color: '#fff', fontSize: 16, fontWeight: '600' }, skipButton: { padding: 10 }, skipText: { color: '#a8a29e', fontSize: 15 }});