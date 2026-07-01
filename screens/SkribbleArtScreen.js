import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, PanResponder, SafeAreaView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { api } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 32;

const C = { bg: '#eef2e6', card: '#f4f7ec', primary: '#5a7a52', text: '#1f2a1c', muted: '#6b7a64', border: '#d7decd', danger: '#d9534f' };
const PALETTE = ['#3a5a40', '#84a98c', '#e07a5f', '#f2cc8f', '#81b29a', '#3d405b', '#1a1a1a'];
const STICKERS = ['🌟', '💖', '🔥', '☁️', '🌸', '✨', '🩹', '🦋'];

export default function SkribbleArtScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' or 'gallery'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [prompt, setPrompt] = useState('Loading creative prompt...');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [color, setColor] = useState(PALETTE[0]);
  const [strokes, setStrokes] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [selectedStickerMode, setSelectedStickerMode] = useState(null);
  
  const [canvasLayout, setCanvasLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const currentRef = useRef(null);
  const isPlacingSticker = useRef(false);

  useEffect(() => {
    fetchPrompt();
    fetchHistory();
  }, []);

  const fetchPrompt = async () => {
    setLoading(true);
    try {
      const res = await api.get('/games/skribble/prompts/random');
      setPrompt(res.data.prompt);
    } catch (e) {
      setPrompt('Draw the weather inside you');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/games/skribble');
      setHistory(res.data);
    } catch (e) {
      console.log("Could not load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      
      // If a sticker is selected, place it and prevent drawing a line
      if (selectedStickerMode) {
        isPlacingSticker.current = true;
        setStickers(p => [...p, { emoji: selectedStickerMode, x: locationX, y: locationY }]);
        setSelectedStickerMode(null); // Unselect sticker after placing
        return;
      }

      isPlacingSticker.current = false;
      const stroke = { color, size: 5, d: `M ${locationX} ${locationY}` };
      currentRef.current = stroke;
      setStrokes((p) => [...p, stroke]);
    },
    onPanResponderMove: (e) => {
      if (isPlacingSticker.current) return; // Don't draw if we just placed a sticker
      
      const { locationX, locationY } = e.nativeEvent;
      if (!currentRef.current) return;

      if (locationX >= 0 && locationX <= canvasLayout.width && locationY >= 0 && locationY <= canvasLayout.height) {
        currentRef.current.d += ` L ${locationX} ${locationY}`;
        setStrokes((p) => {
          const next = [...p];
          next[next.length - 1] = { ...currentRef.current };
          return next;
        });
      }
    },
    onPanResponderRelease: () => {
      currentRef.current = null;
      isPlacingSticker.current = false;
    },
  });

  const clear = () => {
    setStrokes([]);
    setStickers([]);
  };

  const saveArtwork = async () => {
    if (strokes.length === 0 && stickers.length === 0) return;
    setSaving(true);
    try {
      // Save both strokes and stickers in a single JSON payload
      const drawingData = JSON.stringify({ strokes, stickers });
      await api.post('/games/skribble', {
        prompt: prompt,
        drawingDataBase64: drawingData
      });

      Alert.alert("Saved 🎨", "Your artwork has been saved to your gallery!");
      clear();
      fetchPrompt(); 
      fetchHistory(); // Refresh gallery
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save artwork.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to parse history data (handles both old array format and new object format)
  const parseDrawingData = (dataString) => {
    try {
      const parsed = JSON.parse(dataString);
      if (Array.isArray(parsed)) return { strokes: parsed, stickers: [] }; // Legacy support
      return { strokes: parsed.strokes || [], stickers: parsed.stickers || [] };
    } catch {
      return { strokes: [], stickers: [] };
    }
  };

  return (
      <SafeAreaView style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={s.iconTxt}>‹</Text>
          </TouchableOpacity>
          <View style={s.tabWrap}>
            <TouchableOpacity onPress={() => setActiveTab('draw')} style={[s.tab, activeTab === 'draw' && s.activeTab]}>
              <Text style={[s.tabTxt, activeTab === 'draw' && s.activeTabTxt]}>Draw</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('gallery')} style={[s.tab, activeTab === 'gallery' && s.activeTab]}>
              <Text style={[s.tabTxt, activeTab === 'gallery' && s.activeTabTxt]}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <View style={{width: 38}} /> {/* Spacer for centering */}
        </View>

        {activeTab === 'draw' ? (
          <>
            {/* Prompt Card */}
            <View style={s.promptWrap}>
              <View style={s.promptCard}>
                <Text style={s.kicker}>AI DRAWING PROMPT</Text>
                {loading ? (
                  <ActivityIndicator size="small" color={C.primary} style={{marginTop: 5}}/> 
                ) : (
                  <Text style={s.promptTxt}>{prompt}</Text>
                )}
              </View>
            </View>

            {/* DRAWING AREA */}
            <View style={s.canvasContainer}>
              <View 
                style={s.canvas} 
                {...pan.panHandlers}
                onLayout={(e) => setCanvasLayout(e.nativeEvent.layout)}
              >
                <Svg width="100%" height="100%" viewBox={`0 0 ${canvasLayout.width} ${canvasLayout.height}`}>
                  {/* Render Strokes */}
                  {strokes.map((st, i) => (
                      <Path key={`stroke-${i}`} d={st.d} stroke={st.color} strokeWidth={st.size} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  ))}
                  {/* Render Stickers */}
                  {stickers.map((st, i) => (
                      <SvgText key={`sticker-${i}`} x={st.x} y={st.y} fontSize="35" textAnchor="middle" alignmentBaseline="middle">
                        {st.emoji}
                      </SvgText>
                  ))}
                </Svg>
              </View>
            </View>

            {/* Toolbar */}
            <View style={s.toolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollRow}>
                {PALETTE.map((c) => (
                    <TouchableOpacity key={c} onPress={() => { setColor(c); setSelectedStickerMode(null); }} style={[s.swatch, { backgroundColor: c }, color === c && !selectedStickerMode && s.activeSwatch ]} />
                ))}
                
                <View style={s.divider} />
                
                {STICKERS.map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => setSelectedStickerMode(emoji)} style={[s.stickerBtn, selectedStickerMode === emoji && s.activeSticker]}>
                      <Text style={{fontSize: 24}}>{emoji}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={s.clearBtn} onPress={clear}>
                  <Text style={{color: C.danger, fontSize: 12, fontWeight: '700'}}>Clear</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Save Button */}
            <View style={s.saveWrap}>
                <TouchableOpacity style={[s.saveBtnBig, (saving || (strokes.length === 0 && stickers.length === 0)) && { opacity: 0.5 }]} onPress={saveArtwork} disabled={saving || (strokes.length === 0 && stickers.length === 0)}>
                    <Text style={{color: '#fff', fontSize: 16, fontWeight: '700'}}>{saving ? 'Saving...' : 'Save to Gallery'}</Text>
                </TouchableOpacity>
            </View>
          </>
        ) : (
          /* GALLERY TAB */
          <ScrollView contentContainerStyle={s.galleryScroll}>
            {loadingHistory ? (
              <ActivityIndicator color={C.primary} style={{marginTop: 50}} />
            ) : history.length === 0 ? (
              <Text style={s.emptyTxt}>No artworks yet. Go draw something!</Text>
            ) : (
              history.map((item) => {
                const drawing = parseDrawingData(item.drawingDataBase64);
                return (
                  <View key={item.id} style={s.historyCard}>
                    <Text style={s.historyPrompt}>"{item.prompt}"</Text>
                    <View style={s.miniCanvas}>
                      {/* Mini SVG representation */}
                      <Svg width="100%" height="100%" viewBox="0 0 350 350" preserveAspectRatio="xMidYMid meet">
                        {drawing.strokes.map((st, i) => (
                           <Path key={i} d={st.d} stroke={st.color} strokeWidth={st.size} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        ))}
                        {drawing.stickers.map((st, i) => (
                           <SvgText key={`stk-${i}`} x={st.x} y={st.y} fontSize="35" textAnchor="middle" alignmentBaseline="middle">{st.emoji}</SvgText>
                        ))}
                      </Svg>
                    </View>
                    <Text style={s.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                )
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
  );
}

const s = StyleSheet.create({ 
  root: { flex: 1, backgroundColor: C.bg }, 
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border }, 
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' }, 
  iconTxt: { fontSize: 22, color: C.text, marginTop: -2 }, 
  tabWrap: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 20, padding: 4 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabTxt: { fontSize: 13, fontWeight: '600', color: C.muted },
  activeTabTxt: { color: C.primary },
  
  kicker: { fontSize: 10, letterSpacing: 2, color: C.primary, fontWeight: '800', textAlign: 'center' }, 
  promptWrap: { padding: 16, paddingBottom: 8 }, 
  promptCard: { backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: C.border }, 
  promptTxt: { fontSize: 14, color: C.text, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 20 }, 
  
  canvasContainer: { paddingHorizontal: 16, flex: 1, justifyContent: 'center' },
  canvas: { aspectRatio: 1, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 }, 

  toolbar: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: C.border, paddingVertical: 15 },
  scrollRow: { paddingHorizontal: 20, alignItems: 'center' }, 
  swatch: { width: 35, height: 35, borderRadius: 17.5, marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
  activeSwatch: { borderColor: C.text, borderWidth: 3, transform: [{ scale: 1.1 }] },
  divider: { width: 1, height: 25, backgroundColor: C.border, marginHorizontal: 10 },
  stickerBtn: { padding: 5, marginRight: 10, borderRadius: 10 },
  activeSticker: { backgroundColor: C.card, borderWidth: 1, borderColor: C.primary },
  clearBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: C.danger, marginLeft: 10 },

  saveWrap: { padding: 16, backgroundColor: '#fff' },
  saveBtnBig: { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 25, alignItems: 'center' },

  galleryScroll: { padding: 16 },
  emptyTxt: { textAlign: 'center', marginTop: 50, color: C.muted, fontSize: 15 },
  historyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  historyPrompt: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'center', marginBottom: 12 },
  miniCanvas: { width: '100%', aspectRatio: 1, backgroundColor: '#fafafa', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  historyDate: { fontSize: 11, color: C.muted, textAlign: 'right', marginTop: 10 }
});