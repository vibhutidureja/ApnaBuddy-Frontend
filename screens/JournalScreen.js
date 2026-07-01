import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

const C = {
  bg: '#eef2e6', card: '#f4f7ec', primary: '#5a7a52', primaryDark: '#3d5a35',
  text: '#1f2a1c', muted: '#6b7a64', border: '#d7decd', accent: '#b8cba8',
};

export default function JournalScreen({ navigation }) {
  const [mode, setMode] = useState('menu'); // 'menu' | 'guided' | 'free'
  const [freeText, setFreeText] = useState('');
  const [guidedPrompt, setGuidedPrompt] = useState('');
  const [guidedAnswer, setGuidedAnswer] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editingId, setEditingId] = useState(null); 

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/wellness/journal');
      setHistory(res.data);
    } catch (e) {
      console.error("Failed to fetch journal history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const startGuidedMode = async () => {
    setMode('guided');
    setEditingId(null);
    setGuidedAnswer('');
    setLoadingPrompt(true);
    try {
      const res = await api.get('/wellness/journal/prompts/random');
      setGuidedPrompt(res.data.prompt);
    } catch (e) {
      console.error("Failed to fetch prompt", e);
      setGuidedPrompt("What is one thing that brought you peace today?"); 
    } finally {
      setLoadingPrompt(false);
    }
  };

  const startFreeMode = () => {
    setMode('free');
    setEditingId(null);
    setFreeText('');
  };

  const openForEdit = (entry) => {
    setEditingId(entry.id);
    if (entry.journalType === 'PROMPTED' || entry.promptUsed) {
      setMode('guided');
      setGuidedPrompt(entry.promptUsed || 'Guided Reflection');
      setGuidedAnswer(entry.content);
    } else {
      setMode('free');
      setFreeText(entry.content);
    }
  };

  const handleBack = () => {
    if (mode === 'menu') {
      navigation.goBack();
    } else {
      setMode('menu');
      setEditingId(null);
    }
  };

  const saveEntry = async (kind) => {
    setSaving(true);
    try {
      const payload = {
        journalType: kind === 'guided' ? 'PROMPTED' : 'FREEFORM',
        content: kind === 'guided' ? guidedAnswer : freeText,
        promptUsed: kind === 'guided' ? guidedPrompt : null
      };

      if (editingId) {
        await api.put(`/wellness/journal/${editingId}`, payload);
        Alert.alert("Updated ✿", "Your changes have been saved.");
      } else {
        await api.post('/wellness/journal', payload);
        Alert.alert("Saved ✿", "Your thoughts have been securely stored.");
      }

      setMode('menu');
      setFreeText('');
      setGuidedAnswer('');
      setEditingId(null);
      fetchHistory();
    } catch (e) {
      console.error("Failed to save journal", e);
      Alert.alert("Error", "Could not save your entry.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- LOGIC FOR DYNAMIC TITLES & SNIPPETS ---
  const getEntryTitle = (entry) => {
    if (entry.journalType === 'PROMPTED') return entry.promptUsed;
    
    // For freeform, grab the first non-empty line
    const lines = entry.content.split('\n').filter(line => line.trim().length > 0);
    return lines.length > 0 ? lines[0] : 'Untitled Entry';
  };

  const getEntrySnippet = (entry) => {
    if (entry.journalType === 'PROMPTED') return entry.content;

    // For freeform, grab everything AFTER the first line so we don't repeat the title
    const lines = entry.content.split('\n').filter(line => line.trim().length > 0);
    return lines.length > 1 ? lines.slice(1).join(' ').trim() : '...';
  };

  return (
      <SafeAreaView style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={handleBack}>
            <Text style={s.iconTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Journal</Text>
          <View style={s.iconBtn} />
        </View>

        {/* MENU MODE */}
        {mode === 'menu' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              
              <View style={s.titleBlock}>
                <Text style={s.kicker}>QUIET PAGES</Text>
                <Text style={s.h1}>A space just for you.</Text>
                <Text style={s.sub}>Choose how you'd like to journal today. There's no wrong way.</Text>
              </View>

              <TouchableOpacity style={s.optionCard} onPress={startGuidedMode} activeOpacity={0.8}>
                <View style={[s.optIcon, { backgroundColor: C.primary + '1A' }]}><Text style={{ fontSize: 20 }}>✦</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>Guided Reflection</Text>
                  <Text style={s.optDesc}>Personalized AI prompt to explore feelings.</Text>
                </View>
                <Text style={s.arrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.optionCard} onPress={startFreeMode} activeOpacity={0.8}>
                <View style={[s.optIcon, { backgroundColor: C.accent + '33' }]}><Text style={{ fontSize: 20 }}>✎</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>Free Writing</Text>
                  <Text style={s.optDesc}>An empty page. Let your thoughts flow freely.</Text>
                </View>
                <Text style={s.arrow}>→</Text>
              </TouchableOpacity>

              {/* PAST ENTRIES HISTORY */}
              <View style={s.historySection}>
                <Text style={s.h2}>Past Entries</Text>
                
                {loadingHistory ? (
                  <ActivityIndicator size="small" color={C.primary} style={{marginTop: 30}} />
                ) : history.length === 0 ? (
                  <View style={s.emptyState}>
                    <Text style={s.emptyEmoji}>🌿</Text>
                    <Text style={s.emptyText}>Your journal is currently empty.</Text>
                  </View>
                ) : (
                  history.map((entry) => (
                    <TouchableOpacity key={entry.id} style={s.historyCard} onPress={() => openForEdit(entry)} activeOpacity={0.7}>
                      <View style={s.historyHeader}>
                        <View style={[s.typeBadge, { backgroundColor: entry.journalType === 'PROMPTED' ? C.primary + '1A' : C.accent + '33' }]}>
                          <Text style={[s.typeBadgeTxt, { color: entry.journalType === 'PROMPTED' ? C.primaryDark : '#5e6b54' }]}>
                            {entry.journalType === 'PROMPTED' ? '✦ Guided' : '✎ Free'}
                          </Text>
                        </View>
                        <Text style={s.historyDate}>{formatDate(entry.createdAt)}</Text>
                      </View>
                      
                      <Text style={s.historyTitle} numberOfLines={2}>{getEntryTitle(entry)}</Text>
                      <Text style={s.historySnippet} numberOfLines={2}>{getEntrySnippet(entry)}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
        )}

        {/* GUIDED MODE */}
        {mode === 'guided' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, padding: 24 }}>
              {loadingPrompt ? (
                  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color={C.primary}/>
                    <Text style={{textAlign: 'center', marginTop: 16, color: C.muted, fontSize: 15}}>Avenue is reflecting...</Text>
                  </View>
              ) : (
                  <>
                    <Text style={s.kicker}>{editingId ? 'EDITING GUIDED PROMPT' : 'GUIDED PROMPT'}</Text>
                    <Text style={[s.h2, { marginBottom: 20 }]}>{guidedPrompt}</Text>
                    <TextInput
                        style={s.bigInput}
                        multiline
                        value={guidedAnswer}
                        onChangeText={setGuidedAnswer}
                        placeholder="Take your time…"
                        placeholderTextColor={C.muted}
                    />
                    <TouchableOpacity
                        style={[s.primaryBtn, { marginTop: 20, opacity: guidedAnswer.trim() ? 1 : 0.5 }]}
                        disabled={!guidedAnswer.trim() || saving}
                        onPress={() => saveEntry('guided')}>
                      <Text style={s.primaryBtnTxt}>{saving ? 'Saving...' : (editingId ? 'Update entry' : 'Save entry')}</Text>
                    </TouchableOpacity>
                  </>
              )}
            </KeyboardAvoidingView>
        )}

        {/* FREE MODE */}
        {mode === 'free' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, padding: 24 }}>
              <Text style={s.kicker}>{editingId ? 'EDITING FREE PAGE' : 'FREE PAGE'}</Text>
              <Text style={[s.h2, { marginBottom: 20 }]}>Today's thoughts</Text>
              <TextInput
                  style={s.bigInput}
                  multiline
                  value={freeText}
                  onChangeText={setFreeText}
                  placeholder="Dear me…"
                  placeholderTextColor={C.muted}
              />
              <TouchableOpacity
                  style={[s.primaryBtn, { marginTop: 20, opacity: freeText.trim() ? 1 : 0.5 }]}
                  disabled={!freeText.trim() || saving}
                  onPress={() => saveEntry('free')}>
                <Text style={s.primaryBtnTxt}>{saving ? 'Saving...' : (editingId ? 'Update entry' : 'Save entry')}</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
        )}
      </SafeAreaView>
  );
}

const s = StyleSheet.create({ 
  root: { flex: 1, backgroundColor: C.bg }, 
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.6)' }, 
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: 0.5 }, 
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }, 
  iconTxt: { fontSize: 22, color: C.text, marginTop: -2 }, 
  titleBlock: { marginBottom: 12 },
  kicker: { fontSize: 11, letterSpacing: 2, color: C.primary, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' }, 
  h1: { fontSize: 32, color: C.text, fontFamily: 'serif', fontWeight: '500', lineHeight: 38, marginBottom: 8 }, 
  h2: { fontSize: 22, color: C.text, fontWeight: '700', lineHeight: 30 }, 
  sub: { fontSize: 15, color: C.muted, lineHeight: 22 }, 
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }, 
  optIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }, 
  optTitle: { fontSize: 17, color: C.text, fontWeight: '700', marginBottom: 4 }, 
  optDesc: { fontSize: 13, color: C.muted, lineHeight: 18, paddingRight: 10 }, 
  arrow: { fontSize: 20, color: '#ccc', fontWeight: '300' },
  bigInput: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, fontSize: 16, color: C.text, textAlignVertical: 'top', lineHeight: 26, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }, 
  primaryBtn: { backgroundColor: C.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }, 
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  
  // History Section
  historySection: { marginTop: 32, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)', paddingTop: 28 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12, opacity: 0.8 },
  emptyText: { fontSize: 15, color: C.muted, fontWeight: '500' },
  historyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  historyDate: { fontSize: 12, fontWeight: '600', color: '#a0aab2' },
  historyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6, lineHeight: 24, fontFamily: 'serif' },
  historySnippet: { fontSize: 14, color: C.muted, lineHeight: 20 }
});