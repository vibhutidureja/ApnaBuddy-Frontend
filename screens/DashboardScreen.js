import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  SafeAreaView, Animated, Dimensions, Pressable, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(300, SCREEN_W * 0.82);

const C = {
  bg: '#EAEFE0', bgSoft: '#DDE6CF', card: '#F5F4EC',
  primary: '#5A7553', primaryDark: '#3F5A3A', accent: '#B8CBA9',
  text: '#1F2A1C', muted: '#6E7A66', border: '#CBD3B9',
  danger: '#C45A45', dangerSoft: '#F2DDD5',
};

const NAV_ITEMS = [
  { label: 'Dashboard',        screen: 'Dashboard' },
  { label: 'Chat Companion',   screen: 'Chat' },
  { label: 'Wellness & Games', screen: 'Games'},
  { label: 'Journal',          screen: 'Journal'},
  { label: 'Skribble Art',     screen: 'Art'},
  { label: 'My Wellness Report', screen: 'Report', icon: '📊' },
  { label: 'Profile',          screen: 'Profile',   icon: '👤' },
];

// Dynamic logic for the score
function getWellnessData(score) {
  if (score === null) return { label: 'Assessment pending', intent: '“Your journey begins with a single breath.”' };
  if (score >= 80) return { label: 'You are doing great', intent: '“Celebrate your progress today.”' };
  if (score >= 60) return { label: 'Doing okay — keep going', intent: '“Breathe in calm, breathe out tension.”' };
  if (score >= 40) return { label: 'Caution advised — take it slow.', intent: '“One step at a time is enough.”' };
  return { label: 'Reach out for support', intent: '“You are safe. You are not alone.”' };
}

export default function DashboardScreen({ navigation }) {
  const [userData, setUserData] = useState({ name: 'User' });
  const [wellnessScore, setWellnessScore] = useState(null);
  const [emergency, setEmergency] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const slide = useRef(new Animated.Value(-DRAWER_W)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // Refresh data every time you land on the dashboard
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const d = await AsyncStorage.getItem('userData');
          const s = await AsyncStorage.getItem('wellnessScore');
          if (d) setUserData(JSON.parse(d));
          if (s) setWellnessScore(Number(s));
        } catch (e) {
          console.error(e);
        }
      };
      loadData();
    }, [])
  );

  const dynamic = getWellnessData(wellnessScore);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = (cb) => {
    Animated.parallel([
      Animated.timing(slide, { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setDrawerOpen(false);
      if (typeof cb === 'function') cb();
    });
  };

  const goTo = (screen) => {
    if (screen === 'Dashboard') return closeDrawer();
    closeDrawer(() => navigation.navigate(screen));
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* TOP BAR */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.hamburger} onPress={openDrawer} hitSlop={10}>
          <View style={s.bar} />
          <View style={s.bar} />
          <View style={s.bar} />
        </TouchableOpacity>
        <Text style={s.brandTop}>Apna Buddy</Text>
        <TouchableOpacity onPress={() => setEmergency(true)} style={s.sosBtn}>
          <Text style={s.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN SCROLL */}
      <ScrollView style={s.main} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={s.chip}>
          <View style={s.chipDot} />
          <Text style={s.chipText}>A SAFE SPACE</Text>
        </View>

        <Text style={s.h1}>
          Welcome back,{'\n'}
          <Text style={s.h1Italic}>{userData.nickname || userData.name || 'User'}</Text>
        </Text>
        <Text style={s.subtitle}>Hope you're looking after yourself today.</Text>

        {/* Wellness score */}
        <View style={s.card}>
          <Text style={s.smallLabel}>WELLNESS SCORE</Text>
          <Text style={s.bigStat}>{wellnessScore !== null ? wellnessScore : '—'}<Text style={s.statSub}>/100</Text></Text>
          <Text style={s.bodyMuted}>{dynamic.label}</Text>
        </View>

        {/* Retake test */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Test')}>
          <Text style={s.featureEmoji}>📝</Text>
          <Text style={s.featureTitle}>Retake Test</Text>
          <Text style={s.bodyMuted}>Check in with yourself anytime.</Text>
          <Text style={s.cta}>Start test →</Text>
        </TouchableOpacity>

        {/* ADD THIS NEW CARD FOR REPORTS */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Report')}>
          <Text style={s.featureEmoji}>📊</Text>
          <Text style={s.featureTitle}>30-Day Synthesis</Text>
          <Text style={s.bodyMuted}>View your wellness trends, emotional footprint, and AI insights.</Text>
          <Text style={s.cta}>Open report →</Text>
        </TouchableOpacity>

        {/* Intention */}
        <View style={[s.card, s.intentionCard]}>
          <Text style={[s.smallLabel, { color: C.accent }]}>TODAY'S INTENTION</Text>
          <Text style={s.intentionText}>{dynamic.intent}</Text>
        </View>

        {/* AI Companion */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Chat')}>
          <Text style={s.featureEmoji}>💬</Text>
          <Text style={s.featureTitle}>AI Companion</Text>
          <Text style={s.bodyMuted}>Speak freely with someone who listens.</Text>
          <Text style={s.cta}>Start a conversation →</Text>
        </TouchableOpacity>

        {/* Wellness & games */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Games')}>
          <Text style={s.featureTitle}>Wellness & Game</Text>
          <Text style={s.bodyMuted}>Burn away stress with us.</Text>
          <Text style={s.cta}>Explore →</Text>
        </TouchableOpacity>

        {/* Journal */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Journal')}>
          <Text style={s.featureTitle}>Journal</Text>
          <Text style={s.bodyMuted}>Write a guided entry or your own thoughts.</Text>
          <Text style={s.cta}>Open journal →</Text>
        </TouchableOpacity>

        {/* Skribble Art */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Art')}>
          <Text style={s.featureTitle}>Skribble Art</Text>
          <Text style={s.bodyMuted}>Doodle a memory, color your mood.</Text>
          <Text style={s.cta}>Start sketching →</Text>
        </TouchableOpacity>

        {/* Breathing Exercise */}
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Breathing')}>
          <Text style={s.featureTitle}>Breathing Exercise</Text>
          <Text style={s.bodyMuted}>Breathing Exercises are very helpful in stress management.</Text>
          <Text style={s.cta}>Start Exercise →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* DRAWER */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[s.scrim, { opacity: fade }]}>
            <Pressable style={{ flex: 1 }} onPress={() => closeDrawer()} />
          </Animated.View>

          <Animated.View style={[s.drawer, { transform: [{ translateX: slide }] }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={s.drawerHeader}>
                <Text style={s.brand}> Apna Buddy</Text>
                <Text style={s.drawerSub}>Hi, {userData.nickname || userData.name || 'User'}</Text>
              </View>

              <ScrollView style={{ flex: 1 }}>
                {NAV_ITEMS.map(item => {
                  const active = item.screen === 'Dashboard';
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[s.navItem, active && s.navItemActive]}
                      onPress={() => goTo(item.screen)}
                    >
                      <Text style={s.navIcon}>{item.icon || '→'}</Text>
                      <Text style={[s.navText, active && s.navTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={s.emergencyBtn}
                onPress={() => { closeDrawer(() => setEmergency(true)); }}
              >
                <Text style={s.emergencyBtnText}>🚨  Emergency</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

      {/* EMERGENCY MODAL */}
      <Modal visible={emergency} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.sheet, { alignItems: 'center' }]}>
            <Text style={s.emergencyTitle}>You are not alone</Text>
            <Text style={s.bodyMuted}>Please reach out to a trained listener right now.</Text>
            <Text style={s.helpline}>📞 9152987821</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setEmergency(false)}>
              <Text style={s.primaryBtnText}>I am safe now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: C.bg, borderBottomWidth: 1, borderColor: C.border,
  },
  hamburger: { width: 28, justifyContent: 'space-between', height: 18 },
  bar: { height: 2.5, backgroundColor: C.primaryDark, borderRadius: 2 },
  brandTop: { fontSize: 16, fontWeight: '700', color: C.primaryDark },
  sosBtn: {
    backgroundColor: C.dangerSoft, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  sosText: { color: C.danger, fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  main: { flex: 1 },

  chip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: C.card, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 999, marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginRight: 8 },
  chipText: { fontSize: 10, fontWeight: '700', color: C.primaryDark, letterSpacing: 1.2 },

  h1: { fontSize: 28, color: C.text, fontWeight: '500', lineHeight: 36 },
  h1Italic: { fontStyle: 'italic', color: C.primary, fontWeight: '600' },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 8, marginBottom: 22 },

  card: {
    backgroundColor: C.card, borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  smallLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, marginBottom: 8 },
  bigStat: { fontSize: 36, color: C.primary, fontWeight: '600', marginBottom: 4 },
  statSub: { fontSize: 16, color: C.muted, fontWeight: '400' },
  bodyMuted: { fontSize: 13, color: C.muted, lineHeight: 19 },

  intentionCard: { backgroundColor: C.primary, borderColor: C.primary },
  intentionText: { color: C.card, fontSize: 20, fontStyle: 'italic', marginTop: 6, lineHeight: 28 },

  featureEmoji: { fontSize: 26, marginBottom: 10 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4 },
  cta: { color: C.primary, fontWeight: '700', marginTop: 12, fontSize: 13 },

  /* Drawer */
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(31,42,28,0.45)' },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_W,
    backgroundColor: C.card, borderTopRightRadius: 28, borderBottomRightRadius: 28,
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
  drawerHeader: { paddingHorizontal: 8, paddingVertical: 18, borderBottomWidth: 1, borderColor: C.border, marginBottom: 8 },
  brand: { fontSize: 20, fontWeight: '700', color: C.primaryDark },
  drawerSub: { fontSize: 13, color: C.muted, marginTop: 4 },

  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 4,
  },
  navItemActive: { backgroundColor: C.bgSoft },
  navIcon: { fontSize: 16, marginRight: 12 },
  navText: { color: C.muted, fontSize: 14, fontWeight: '500' },
  navTextActive: { color: C.primaryDark, fontWeight: '700' },

  emergencyBtn: {
    backgroundColor: C.dangerSoft, paddingVertical: 14, borderRadius: 18,
    alignItems: 'center', marginTop: 8,
  },
  emergencyBtnText: { color: C.danger, fontWeight: '700' },

  /* Emergency modal */
  overlay: { flex: 1, backgroundColor: 'rgba(31,42,28,0.45)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  sheet: { backgroundColor: C.card, borderRadius: 28, padding: 26, width: '100%', maxWidth: 420 },
  emergencyTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  helpline: { fontSize: 18, color: C.primary, fontWeight: '700', marginVertical: 18 },
  primaryBtn: { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 999, alignItems: 'center' },
  primaryBtnText: { color: C.card, fontWeight: '700', fontSize: 15 },
});