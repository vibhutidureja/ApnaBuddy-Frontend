import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Animated, Easing, PanResponder,
  Dimensions, Modal, Platform, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av'; // Added for sound
import { api } from '../services/api';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = {
  bg: '#1A1A1A',
  primary: '#8A9A7B', 
  text: '#E8E8E8',
  paper: '#FDF5E6',
  fireCore: '#FFFBE6',
  fireInner: '#FFD700',
  fireMid: '#FF8C00',
  fireOuter: '#FF4500',
};

export default function GamesScreen({ navigation }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [burnCount, setBurnCount] = useState(0);
  const [sound, setSound] = useState();

  const fireScale = useRef(new Animated.Value(1)).current;
  const emberAnims = useRef([...Array(12)].map(() => new Animated.Value(0))).current;

  // --- Sound Logic ---
  async function playFireSound() {
    const { sound } = await Audio.Sound.createAsync(
       { uri: 'https://www.soundjay.com/nature/sounds/fire-crackling-01.mp3' },
       { shouldPlay: true, isLooping: true, volume: 0.5 }
    );
    setSound(sound);
  }

  useEffect(() => {
    playFireSound();
    
    // UI Animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireScale, { toValue: 1.08, duration: 50, useNativeDriver: true }),
        Animated.timing(fireScale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
      ])
    ).start();

    emberAnims.forEach((anim, i) => {
      const animateEmber = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000 + Math.random() * 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
          delay: i * 200,
        }).start(() => animateEmber());
      };
      animateEmber();
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const onBurn = async (env) => {
    try {
      await api.post('/wellness/fire-game', {
        thoughtToBurn: env.text,
        moodBefore: 8, 
        moodAfter: 4
      });
    } catch (e) {
      console.error("Failed to log fire game:", e);
    }

    Animated.sequence([
      Animated.timing(fireScale, { toValue: 1.5, duration: 150, useNativeDriver: true }),
      Animated.spring(fireScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(env.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(env.scale, { toValue: 0.2, duration: 800, useNativeDriver: true }),
      Animated.timing(env.pan.y, { toValue: H - 150, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      setEnvelopes(prev => prev.filter(e => e.id !== env.id));
      setBurnCount(c => c + 1);
    });
  };

  const addLetter = () => {
    if (!inputText.trim()) return;
    setEnvelopes([...envelopes, {
      id: Date.now().toString(),
      text: inputText,
      pan: new Animated.ValueXY({ x: W / 2 - 80, y: H * 0.15 }),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }]);
    setInputText('');
    setShowInput(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15}}>
            <Text style={{color: COLORS.text, fontSize: 24}}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.eyebrow}>RELEASE YOUR BURDENS</Text>
            <Text style={s.title}>Burn whatever is heavy.</Text>
          </View>
        </View>
        <TouchableOpacity style={s.addButton} onPress={() => setShowInput(true)}>
          <Text style={s.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={s.interactiveArea}>
        {emberAnims.map((anim, i) => (
          <Animated.View key={i} style={[s.ember, {
            left: (W * 0.3) + (Math.random() * W * 0.4),
            opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [H - 200, H - 500] }) },
              { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, (i % 2 === 0 ? 30 : -30)] }) }
            ]
          }]} />
        ))}

        {envelopes.map(env => (
          <Animated.View
            key={env.id}
            {...PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onPanResponderGrant: () => { 
                env.pan.setOffset({ x: env.pan.x._value, y: env.pan.y._value }); 
                env.pan.setValue({ x: 0, y: 0 });
              },
              onPanResponderMove: Animated.event([null, { dx: env.pan.x, dy: env.pan.y }], { useNativeDriver: false }),
              onPanResponderRelease: (_, gesture) => {
                env.pan.flattenOffset();
                // Check if dropped near the fire
                if (gesture.moveY > H - 280) {
                  onBurn(env);
                } 
                // If not in fire, it just stays where the user released it.
              }
            }).panHandlers}
            style={[s.letter, { transform: [...env.pan.getTranslateTransform(), { scale: env.scale }], opacity: env.opacity }]}
          >
            <LinearGradient colors={[COLORS.paper, '#E6D5B8']} style={s.letterInner}>
              <Text style={s.letterText} numberOfLines={3}>{env.text}</Text>
              <View style={s.seal} />
            </LinearGradient>
          </Animated.View>
        ))}

        <View style={s.fireAnchor}>
          <Animated.View style={[s.fireGlow, { transform: [{ scale: fireScale }] }]} />
          
          <View style={s.flameWrapper}>
            {[...Array(5)].map((_, i) => (
              <Animated.View key={i} style={[
                s.flame,
                {
                  width: 60 + i * 15,
                  height: 100 + i * 20,
                  backgroundColor: i === 0 ? COLORS.fireCore : i < 3 ? COLORS.fireMid : COLORS.fireOuter,
                  opacity: 0.6 - (i * 0.1),
                  transform: [{ scaleX: fireScale }, { scaleY: fireScale }]
                }
              ]} />
            ))}
          </View>
          
          <View style={s.logs}>
            <View style={[s.log, { transform: [{ rotate: '-15deg' }] }]} />
            <View style={[s.log, { transform: [{ rotate: '15deg' }], marginLeft: -30 }]} />
          </View>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>Total Burdens Released: {burnCount}</Text>
      </View>

      <Modal visible={showInput} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>What would you like to let go?</Text>
            <TextInput
              style={s.input}
              placeholder="Write it down here..."
              placeholderTextColor="#999"
              multiline
              value={inputText}
              onChangeText={setInputText}
              autoFocus
            />
            <TouchableOpacity style={s.sealButton} onPress={addLetter}>
              <Text style={s.sealButtonText}>Seal Letter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowInput(false)}>
              <Text style={s.cancelButton}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: COLORS.text, fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  addButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  addButtonText: { color: '#FFF', fontSize: 26, fontWeight: '300' },
  interactiveArea: { flex: 1, position: 'relative' },
  letter: { position: 'absolute', width: 160, height: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  letterInner: { flex: 1, borderRadius: 2, padding: 12, borderTopWidth: 1, borderColor: '#FFF' },
  letterText: { fontSize: 12, fontStyle: 'italic', color: '#555', textAlign: 'center', marginTop: 10 },
  seal: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#800', alignSelf: 'center', position: 'absolute', bottom: -10 },
  fireAnchor: { position: 'absolute', bottom: 0, width: W, height: 200, alignItems: 'center' },
  fireGlow: { position: 'absolute', bottom: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255, 69, 0, 0.3)', filter: [{ blur: 40 }] },
  flameWrapper: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', marginBottom: 40 },
  flame: { position: 'absolute', bottom: 0, borderTopLeftRadius: 100, borderTopRightRadius: 100, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  ember: { position: 'absolute', width: 4, height: 4, backgroundColor: COLORS.fireInner, borderRadius: 2 },
  logs: { flexDirection: 'row', bottom: 10 },
  log: { width: 120, height: 30, backgroundColor: '#2B1B17', borderRadius: 5, borderBottomWidth: 4, borderColor: '#1A0F0D' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 16 },
  sealButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  sealButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { color: '#999', textAlign: 'center', marginTop: 15 },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 12, letterSpacing: 1 }
});