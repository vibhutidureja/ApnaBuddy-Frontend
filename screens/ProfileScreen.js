import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const C = {
  ink: '#1c1917', muted: '#78716c', faint: '#a8a29e',
  sage: '#5a7a5a', sageSoft: 'rgba(90,122,90,0.15)',
  card: 'rgba(255,255,255,0.55)', border: 'rgba(0,0,0,0.06)', btn: '#8a9a7b',
};

const FIELDS = [
  { key: 'nickname',     label: 'NICKNAME',              placeholder: 'What should we call you?' },
  { key: 'ageGroup',     label: 'YOUR AGE',              placeholder: 'e.g. 24', keyboardType: 'numeric' },
  { key: 'gender',       label: 'YOU IDENTIFY AS',       type: 'choice', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'] },
  { key: 'occupation',   label: 'YOUR OCCUPATION',       placeholder: 'Student, Developer, etc.' },
  { key: 'goal',         label: 'YOUR GOAL',             placeholder: 'To enjoy life…' },
  { key: 'cope',         label: 'YOUR COPING MECHANISM', placeholder: 'Walks, music…' },
  { key: 'concern',      label: 'YOUR PRIMARY CONCERN',  placeholder: 'Stress, sleep…' },
  { key: 'feelingToday', label: 'HOW ARE YOU FEELING TODAY?', placeholder: 'Take your time…', multiline: true },
];

// React Native blocks "http://" images. This safely forces the Google URL to be secure.
const getSecureImageUrl = (url) => {
  if (!url) return null;
  return url.replace('http://', 'https://');
};

export default function ProfileScreen({ navigation }) {
  const [data, setData] = useState({});
  const [authData, setAuthData] = useState({}); 
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // NEW: State to track if the Google image URL is a dead link
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      // 1. Fetch Google Auth Data
      try {
        const authRes = await api.get('/auth/me');
        if (authRes.data) {
          setAuthData(authRes.data);
        }
      } catch (e) {
        console.log("Could not fetch auth data.");
      }

      // 2. Fetch Onboarding Details
      try {
        const profileRes = await api.get('/user/profile');
        const p = profileRes.data;

        const backendData = {
          nickname:     p.nickname || '',
          ageGroup:     p.ageGroup || '',
          gender:       p.gender || '',
          occupation:   p.occupation || '',
          goal:         p.goals || '',
          cope:         p.copingMechanisms || '',
          concern:      p.primaryConcerns || '',
          feelingToday: p.feelingToday || '',
        };

        setData(backendData);
        await AsyncStorage.setItem('userData', JSON.stringify(backendData));
        
      } catch (e) {
        // Fallback to local storage if backend fails
        const raw = await AsyncStorage.getItem('userData');
        const parsed = raw ? JSON.parse(raw) : {};
        setData(parsed);
      }

    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const startEdit = (key) => { setEditing(key); setDraft(data[key] ?? ''); };
  const cancelEdit = () => { setEditing(null); setDraft(''); };

  const saveEdit = async (key, valueOverride) => {
    const value = valueOverride !== undefined ? valueOverride : draft;
    const next = { ...data, [key]: value };
    setData(next);
    setEditing(null);
    setSaving(true);
    
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(next));
      await api.put('/user/profile', next);
    } catch (e) { 
      Alert.alert('Sync Error', 'Saved locally, but could not reach the server.'); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={C.sage} /></View>
      </LinearGradient>
    );
  }

  const securePicUrl = getSecureImageUrl(authData.pictureUrl);
  const initial = (authData.name || data.nickname || '?').trim().charAt(0).toUpperCase();

  return (
    <LinearGradient colors={['#f5f0e8', '#eef2e6', '#f5f0e8']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          {saving ? <ActivityIndicator color={C.sage} /> : <Text style={styles.savedTag}>SAVED</Text>}
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {/* NEW: Robust Image Error Handling */}
            {securePicUrl && !imageFailed ? (
               <Image 
                 source={{uri: securePicUrl}} 
                 style={styles.profileImg} 
                 onError={() => {
                   console.log("Google Image URL is dead/broken. Falling back to Initial.");
                   setImageFailed(true);
                 }}
               />
            ) : (
               <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          
          <Text style={styles.title}>{authData.name || data.nickname || 'Your Name'}</Text>
          <Text style={styles.titleItalic}>profile</Text>
          {authData.email && <Text style={styles.emailText}>{authData.email}</Text>}
          <Text style={styles.subtitle}>A gentle space for the things that make you, you.</Text>
        </View>

        <View style={{ marginTop: 18 }}>
          {FIELDS.map((f) => {
            const isEditing = editing === f.key;
            const value = data[f.key];

            return (
              <View key={f.key} style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{f.label}</Text>
                  {!isEditing && (
                    <TouchableOpacity onPress={() => startEdit(f.key)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                      <Text style={styles.editLink}>✎ Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {f.type === 'choice' ? (
                  <View style={styles.choiceGrid}>
                    {f.options.map((opt) => {
                      const selected = value === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          activeOpacity={0.7}
                          onPress={() => saveEdit(f.key, opt)}
                          style={[styles.choice, selected && styles.choiceSelected]}
                        >
                          <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : isEditing ? (
                  <View>
                    <TextInput
                      style={[styles.input, f.multiline && { height: 90, textAlignVertical: 'top' }]}
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={f.placeholder}
                      placeholderTextColor={C.faint}
                      keyboardType={f.keyboardType || 'default'}
                      multiline={!!f.multiline}
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={cancelEdit} style={[styles.smallBtn, styles.cancelBtn]}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => saveEdit(f.key)} style={[styles.smallBtn, styles.saveBtn]}>
                        <Text style={styles.saveText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.valueCard}>
                    <Text style={[styles.valueText, !value && { color: C.faint, fontStyle: 'italic' }]}>
                      {value || 'Not set yet — tap edit to add'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.continueButton} activeOpacity={0.85} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.continueText}>Done  →</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.5)' },
  backArrow: { fontSize: 18, color: C.muted, marginRight: 4, marginTop: -2 },
  backText: { fontSize: 13, color: C.muted, fontWeight: '500' },
  savedTag: { fontSize: 11, fontWeight: '600', color: C.sage, letterSpacing: 2 },
  avatarWrap: { alignItems: 'center', marginTop: 6 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.sageSoft, borderWidth: 1, borderColor: C.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  profileImg: { width: '100%', height: '100%', borderRadius: 41 },
  avatarText: { fontSize: 32, color: C.sage, fontWeight: '300' },
  title: { fontSize: 28, color: C.ink, fontFamily: 'serif', fontWeight: '300' },
  titleItalic: { fontSize: 28, color: C.sage, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '300' },
  emailText: { fontSize: 14, color: C.muted, marginTop: 4, fontStyle: 'italic' },
  subtitle: { textAlign: 'center', fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 6, paddingHorizontal: 16 },
  fieldBlock: { marginTop: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  label: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 1.5 },
  editLink: { fontSize: 12, color: C.sage, fontWeight: '600' },
  valueCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16 },
  valueText: { fontSize: 15, color: C.ink },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.sage, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, fontSize: 15, color: C.ink },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  smallBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.muted, fontWeight: '500', fontSize: 13 },
  saveBtn: { backgroundColor: C.sage },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { flexGrow: 1, minWidth: '45%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  choiceSelected: { backgroundColor: C.sageSoft, borderColor: C.sage },
  choiceText: { fontSize: 14, fontWeight: '500', color: C.muted },
  choiceTextSelected: { color: C.ink },
  continueButton: { backgroundColor: C.btn, borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 28, shadowColor: C.btn, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});