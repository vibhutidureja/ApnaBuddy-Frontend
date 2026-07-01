import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function OnboardingScreen({ navigation }) {
  const { user, setUser } = useContext(AuthContext);

  // States matching your UI
  const [nickname, setNickname] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [occupation, setOccupation] = useState('');
  const [goal, setGoal] = useState('');
  const [cope, setCope] = useState('');
  const [concern, setConcern] = useState('');
  const [feelingToday, setFeelingToday] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

  // Ensure @NotBlank constraints from Java are met
  const canContinue = 
    nickname.trim().length > 0 && 
    occupation.trim().length > 0 && 
    feelingToday.trim().length > 0;

  const handleSubmit = async () => {
    if (!canContinue) return;
    setLoading(true);

    // Exact mapping to OnboardingRequest.java
    const payload = {
      nickname: nickname.trim(),
      ageGroup: ageGroup.trim() || 'Not specified',
      gender: gender || 'Prefer not to say',
      country: 'Not specified',
      occupation: occupation.trim(),
      occupationDetails: 'General',
      feelingToday: feelingToday.trim(),
      primaryConcerns: concern.trim() ? [concern.trim()] : ['General Wellness'],
      overwhelmedScale: 5,
      overwhelmedFrequency: 'Sometimes',
      safetyRisk: false,
      copingMechanisms: cope.trim() ? [cope.trim()] : ['General coping'],
      sleepQuality: 'Average',
      goals: goal.trim() ? [goal.trim()] : ['Find peace'],
      chatPreference: 'Empathetic and Friendly'
    };

    try {
      const response = await api.post('/user/onboarding', payload);

      // Check if backend flagged safety risk
      if (response.data && response.data.includes("CRITICAL_SAFETY_FLAG")) {
        console.log("Safety flag detected. Implement helpline UI if needed.");
      }

      await AsyncStorage.setItem('hasOnboarded', 'true');
      await AsyncStorage.setItem('userData', JSON.stringify({ name: nickname }));

      // Move user to the next screen (Assessment)
      setUser({ ...user, hasCompletedOnboarding: true });
      
    } catch (e) {
      console.error("Onboarding Error:", e.response?.data || e.message);
      alert("Failed to save details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>3 / 3</Text>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tell us a little</Text>
          <Text style={styles.titleItalic}>about you</Text>
        </View>
        <Text style={styles.subtitle}>Just a few gentle details so we can make this space yours.</Text>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="What should we call you?" placeholderTextColor="#a8a29e" />

          <Text style={styles.label}>YOUR AGE</Text>
          <TextInput style={styles.input} value={ageGroup} onChangeText={setAgeGroup} placeholder="e.g. 24" placeholderTextColor="#a8a29e" keyboardType="numeric" />

          <Text style={styles.label}>YOUR OCCUPATION</Text>
          <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Student, Developer, etc." placeholderTextColor="#a8a29e" />

          <Text style={styles.label}>YOUR GOAL</Text>
          <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="To be able to enjoy life, etc." placeholderTextColor="#a8a29e" />

          <Text style={styles.label}>YOUR COPING MECHANISM</Text>
          <TextInput style={styles.input} value={cope} onChangeText={setCope} placeholder="Reading, walking, etc." placeholderTextColor="#a8a29e" />

          <Text style={styles.label}>YOUR PRIMARY CONCERN</Text>
          <TextInput style={styles.input} value={concern} onChangeText={setConcern} placeholder="Stress, anxiety, overthinking, etc." placeholderTextColor="#a8a29e" />

          <Text style={styles.label}>HOW ARE YOU FEELING TODAY?</Text>
          <TextInput style={styles.input} value={feelingToday} onChangeText={setFeelingToday} placeholder="Take your time..." placeholderTextColor="#a8a29e" />

          <Text style={styles.label}>YOU IDENTIFY AS</Text>
          <View style={styles.genderGrid}>
            {genderOptions.map((opt) => {
              const selected = gender === opt;
              return (
                <TouchableOpacity key={opt} style={[styles.genderOption, selected && styles.genderOptionSelected]} onPress={() => setGender(opt)} activeOpacity={0.7}>
                  <Text style={[styles.genderText, selected && styles.genderTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]} onPress={handleSubmit} disabled={!canContinue || loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueText}>Continue  →</Text>}
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  backButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.5)' },
  backArrow: { fontSize: 18, color: '#78716c', marginRight: 4, marginTop: -2 },
  backText: { fontSize: 13, color: '#78716c', fontWeight: '500' },
  stepIndicator: { fontSize: 12, fontWeight: '500', color: '#a8a29e', letterSpacing: 2, textTransform: 'uppercase' },
  titleContainer: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 30, color: '#1c1917', fontFamily: 'serif', fontWeight: '300' },
  titleItalic: { fontSize: 30, color: '#5a7a5a', fontFamily: 'serif', fontStyle: 'italic', fontWeight: '300' },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#78716c', lineHeight: 20, marginBottom: 30 },
  formSection: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '600', color: '#78716c', letterSpacing: 1.5, marginBottom: 8, marginTop: 18, marginLeft: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, fontSize: 15, color: '#1c1917' },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genderOption: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  genderOptionSelected: { backgroundColor: 'rgba(90,122,90,0.15)', borderColor: '#5a7a5a' },
  genderText: { fontSize: 14, fontWeight: '500', color: '#78716c' },
  genderTextSelected: { color: '#1c1917' },
  continueButton: { backgroundColor: '#8a9a7b', borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: '#8a9a7b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  continueButtonDisabled: { opacity: 0.5 },
  continueText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(90,122,90,0.3)' },
  dotActive: { width: 24, borderRadius: 3, backgroundColor: '#5a7a5a' }
});