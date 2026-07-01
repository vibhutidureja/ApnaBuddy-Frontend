import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { api } from '../services/api';

const C = { bg: '#EEF1E6', card: '#F4F6EC', primary: '#5A7250', primaryFg: '#F4F6EC', text: '#1F2A1E', border: '#CFD6BF' };

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const timerRef = useRef(null);
  const scrollRef = useRef();

  useEffect(() => {
    startSession();
    return () => clearTimer(); // Cleanup on exit
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const resetTimer = (id) => {
    clearTimer();
    // 10 minutes = 600000 ms
    timerRef.current = setTimeout(() => {
      autoDeleteSession(id);
    }, 600000);
  };

  const startSession = async () => {
    try {
      const res = await api.get('/chat/sessions/latest');
      setSessionId(res.data.id);
      loadMessages(res.data.id);
    } catch (e) {
      console.log("No active session, creating new...");
    }
  };

  const loadMessages = async (id) => {
    try {
      const res = await api.get(`/chat/sessions/${id}/messages`);
      setMessages(res.data);
      resetTimer(id);
    } catch (e) { console.error(e); }
  };

  const autoDeleteSession = async (id) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      Alert.alert("Session Closed", "For your privacy, this inactive chat has been permanently deleted.");
      navigation.navigate('Dashboard');
    } catch (e) { console.error(e); }
  };

  const send = async () => {
    if (!input.trim() || !sessionId) return;
    const userText = input;
    
    // Optimistically add user message to UI
    setMessages(p => [...p, { id: Date.now(), role: 'USER', content: userText }]);
    setInput('');
    setLoading(true);
    resetTimer(sessionId);

    try {
      const res = await api.post(`/chat/sessions/${sessionId}/ask`, { prompt: userText });
      
      const aiText = res.data.response;
      const uiAction = res.data.actionToTrigger; // Might be undefined, and that's okay!
      
      // Add AI response to UI
      setMessages(p => [...p, { id: Date.now()+1, role: 'ASSISTANT', content: aiText }]);

      // --- FOOLPROOF AUTOMATIC TRIGGER LOGIC ---
      // 1. Checks if Java sent the flag OR
      // 2. Checks if the AI used the secret trigger phrase from the Tool instruction
      const needsBreathing = 
          uiAction === 'BREATHING_EXERCISE' || 
          aiText.toLowerCase().includes("breathing animation");

      if (needsBreathing) {
        console.log("🚨 TRIGGER DETECTED! Automatically navigating...");
        
        // Wait 1.5 seconds so the user can see the chat bubble appear, then forcefully navigate
        setTimeout(() => {
            navigation.navigate('Breathing');
        }, 1500);
      }

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to send message. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
              <Text>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={s.title}>Avenue AI</Text>
          <View style={{width: 50}}/>
        </View>

        <ScrollView 
            ref={scrollRef} 
            style={s.msgs} 
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: true})}
        >
          {messages.map((m, i) => (
              <View key={i} style={[s.bubble, m.role === 'USER' ? s.userBubble : s.botBubble]}>
                <Text style={{color: m.role === 'USER' ? C.primaryFg : C.text}}>{m.content}</Text>
              </View>
          ))}
          {loading && <Text style={{marginLeft: 20}}>Avenue is typing...</Text>}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput 
              style={s.input} 
              value={input} 
              onChangeText={setInput} 
              placeholder="Share what's on your mind…" 
              multiline 
          />
          <TouchableOpacity style={s.sendBtn} onPress={send}>
              <Text style={{color: '#fff'}}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
}

const s = StyleSheet.create({ 
  safe: { flex: 1, backgroundColor: C.bg }, 
  header: { flexDirection: 'row', padding: 15, backgroundColor: C.card, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.border }, 
  title: { fontSize: 16, fontWeight: 'bold' }, 
  msgs: { flex: 1, padding: 16 }, 
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 20, marginBottom: 10 }, 
  userBubble: { alignSelf: 'flex-end', backgroundColor: C.primary }, 
  botBubble: { alignSelf: 'flex-start', backgroundColor: C.card, borderWidth: 1, borderColor: C.border }, 
  inputRow: { flexDirection: 'row', padding: 10, backgroundColor: C.card }, 
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: C.border }, 
  sendBtn: { backgroundColor: C.primary, borderRadius: 20, padding: 12, justifyContent: 'center', marginLeft: 8 }
});