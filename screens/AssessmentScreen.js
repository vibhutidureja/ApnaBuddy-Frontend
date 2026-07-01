import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Platform // 🔥 Essential for Web compatibility
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function AssessmentScreen({ navigation }) {
  const { user, setUser } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch questions from Backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/assessment/questions');
        setQuestions(res.data);
      } catch (e) {
        console.error("Fetch questions failed", e);
        Alert.alert("Connection Error", "Could not load assessment questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const selectAnswer = (qId, value) => {
    setAnswers({ ...answers, [qId]: value });
  };

  // 2. Handle Submission
  const handleSubmit = async () => {
    // Validation
    if (Object.keys(answers).length < questions.length) {
      Alert.alert("Incomplete", "Please answer every question before submitting.");
      return;
    }

    setSubmitting(true);

    // Format Payload for Spring Boot
    const payload = Object.keys(answers).map(id => ({
      questionId: Number(id),
      answer: answers[id]
    }));

    try {
      console.log("Submitting payload...", payload);
      const res = await api.post('/assessment/submit', { answers: payload });
      
      // Safe score extraction
      const score = res.data?.overall?.wellnessScore || res.data?.wellnessScore || 0;

      // Persist data locally for the Dashboard
      await AsyncStorage.setItem('wellnessScore', String(score));
      
      const existingData = await AsyncStorage.getItem('userData');
      const parsedData = existingData ? JSON.parse(existingData) : {};
      
      await AsyncStorage.setItem('userData', JSON.stringify({ 
        ...parsedData, 
        name: user?.nickname || user?.name || 'User' 
      }));

      // Success Logic with Navigation Fix
      const finish = () => {
        setUser(prev => ({ ...prev, hasCompletedAssessment: true }));
        navigation.replace('Dashboard');
      };

      if (Platform.OS === 'web') {
        // Standard browser alert for Web
        alert(`Assessment Complete! Your Wellness Score: ${score}/100`);
        finish();
      } else {
        // Native Alert with button for Mobile
        Alert.alert(
          "Assessment Complete", 
          `Your Wellness Score: ${score}/100`,
          [{ text: "Go to Dashboard", onPress: finish }],
          { cancelable: false }
        );
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.status || error.message;
      console.error("Submission failed details:", error);
      Alert.alert("Error", `Problem saving assessment: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5a7a5a" />
        <Text style={{ marginTop: 10, color: '#5a7a5a' }}>Preparing your assessment...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Progress Bar Area */}
        <Text style={styles.progressText}>Question {currentStep + 1} of {questions.length}</Text>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((currentStep + 1) / questions.length) * 100}%` }]} />
        </View>

        {/* Question Card */}
        <View style={styles.card}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
          
          <View style={styles.optionsGroup}>
            {[0, 1, 2, 3, 4].map((score) => {
              const isSelected = answers[currentQuestion.id] === score;
              return (
                <TouchableOpacity
                  key={score}
                  style={[styles.optionBtn, isSelected && styles.selectedBtn]}
                  onPress={() => selectAnswer(currentQuestion.id, score)}
                  activeOpacity={0.7}
                >
                  <Text style={isSelected ? styles.selectedLabel : styles.scoreLabel}>
                    {score === 0 ? "Not at all" : score === 4 ? "Very much" : `Score: ${score}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Navigation */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.backBtn, currentStep === 0 && { opacity: 0 }]}
              onPress={() => setCurrentStep(p => p - 1)}
              disabled={currentStep === 0}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            {currentStep < questions.length - 1 ? (
              <TouchableOpacity 
                style={[styles.nextBtn, !answers[currentQuestion.id] && answers[currentQuestion.id] !== 0 && styles.disabledBtn]} 
                onPress={() => setCurrentStep(p => p + 1)}
                disabled={!answers[currentQuestion.id] && answers[currentQuestion.id] !== 0}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.disabledBtn]} 
                onPress={handleSubmit} 
                disabled={submitting}
              >
                <Text style={styles.nextBtnText}>{submitting ? 'Calculating...' : 'Submit Assessment'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f0e8' },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  progressText: { textAlign: 'center', marginBottom: 10, color: '#5a7a5a', fontWeight: '600', letterSpacing: 1 },
  progressBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(90,122,90,0.1)', borderRadius: 2, marginBottom: 30, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#5a7a5a' },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 32, width: '100%', maxWidth: 500, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  questionText: { fontSize: 20, color: '#1c1917', marginBottom: 25, lineHeight: 28, fontFamily: 'serif' },
  optionsGroup: { gap: 12 },
  optionBtn: { padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 20 },
  selectedBtn: { backgroundColor: 'rgba(90,122,90,0.08)', borderColor: '#5a7a5a', borderWidth: 2 },
  scoreLabel: { color: '#78716c', fontSize: 15, fontWeight: '500' },
  selectedLabel: { color: '#5a7a5a', fontWeight: '700', fontSize: 15 },
  navButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, alignItems: 'center' },
  backBtn: { padding: 12 },
  backBtnText: { color: '#a8a29e', fontWeight: '600' },
  nextBtn: { backgroundColor: '#5a7a5a', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  submitBtn: { backgroundColor: '#3d5a3d', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabledBtn: { backgroundColor: '#d6d3d1' }
});