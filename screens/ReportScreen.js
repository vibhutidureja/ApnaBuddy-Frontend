import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { api } from '../services/api';

const { width } = Dimensions.get('window');
const C = { primary: '#5A7A52', bg: '#EEF2E6', card: '#FFF', text: '#1A1A1A', muted: '#666' };
const CHART_CONFIG = {
  backgroundGradientFrom: '#FFF', backgroundGradientTo: '#FFF',
  color: (opacity = 1) => `rgba(90, 122, 82, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2, barPercentage: 0.7, useShadowColorFromDataset: false,
  propsForDots: { r: "4", strokeWidth: "2", stroke: C.primary }
};

// Helper to fix graphs breaking when there is only 1 data point
const padData = (dataArray) => {
  if (dataArray.length === 1) return [dataArray[0], dataArray[0]]; // Draw a flat line
  return dataArray;
};

export default function ReportScreen({ navigation }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get('/wellness/report');
      setReport(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color={C.primary}/></View>;
  if (!report) return <View style={s.container}><Text style={s.error}>Not enough data yet.</Text></View>;

  // Prepare Data
  const safeWellness = padData(report.wellnessTrend);
  const lineData = { labels: safeWellness.map(t => t.date), datasets: [{ data: safeWellness.map(t => t.score || 0) }] };

  const safeChatTrend = padData(report.chatMoodTrend);
  const chatLineData = { labels: safeChatTrend.map(t => t.date), datasets: [{ data: safeChatTrend.map(t => t.score || 0) }] };

  const pieColors = ['#5A7A52', '#84A98C', '#CAD2C5', '#354F52', '#2F3E46'];
  const pieData = Object.keys(report.emotionComposition).map((key, i) => ({
    name: key, population: report.emotionComposition[key], color: pieColors[i % pieColors.length], legendFontColor: '#333', legendFontSize: 13
  }));

  const sentimentData = Object.keys(report.sentimentComposition).map((key, i) => ({
    name: key, population: report.sentimentComposition[key], color: pieColors[(i+2) % pieColors.length], legendFontColor: '#333', legendFontSize: 13
  }));

  const barData = {
    labels: report.copingEfficacy.map(a => a.activity.substring(0, 8)),
    datasets: [{ data: report.copingEfficacy.map(a => a.improvement) }]
  };

  return (
    <View style={s.container}>
      {/* Top Navigation */}
      <View style={s.navHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={s.backBtn}>
          <Text style={s.backTxt}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={s.disclaimer}>⚠️ This report is for self-reflection and is not a clinical diagnosis.</Text>
        <Text style={s.header}>Your 30-Day Synthesis</Text>

        {/* 1. Quick Mood Summary */}
        <View style={[s.card, { backgroundColor: '#E8EFE3', borderColor: C.primary }]}>
          <Text style={s.cardTitle}>Quick Summary</Text>
          <Text style={[s.bodyText, { fontWeight: '500', color: C.primary }]}>{report.moodSummary}</Text>
        </View>

        {/* 2. Detailed Overview */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Detailed Overview</Text>
          <Text style={s.bodyText}>{report.summaryNarrative}</Text>
        </View>

        {/* 3. Assessment Trend */}
        {report.wellnessTrend.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Assessment Trajectory</Text>
            <LineChart data={lineData} width={width - 80} height={220} chartConfig={CHART_CONFIG} bezier style={s.chart} />
          </View>
        )}

        {/* 4. Chat Session Risk/Depression Trend */}
        {report.chatMoodTrend.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Chat Session Mood Intensity</Text>
            <Text style={s.subText}>(Higher = Heavier Mood/Stress)</Text>
            <LineChart data={chatLineData} width={width - 80} height={220} chartConfig={CHART_CONFIG} bezier style={s.chart} />
          </View>
        )}

        {/* 5. Emotions Pie */}
        {pieData.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Emotional Footprint</Text>
            <PieChart data={pieData} width={width - 80} height={200} chartConfig={CHART_CONFIG} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} />
          </View>
        )}

        {/* 6. Sentiment Pie */}
        {sentimentData.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Overall Sentiment Spread</Text>
            <PieChart data={sentimentData} width={width - 80} height={200} chartConfig={CHART_CONFIG} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} />
          </View>
        )}

        {/* 7. Coping Efficacy */}
        {report.copingEfficacy.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Most Effective Activities</Text>
            <Text style={s.subText}>(Average points of mood improvement)</Text>
            <BarChart data={barData} width={width - 80} height={220} yAxisLabel="+" chartConfig={CHART_CONFIG} style={s.chart} />
          </View>
        )}

        {/* 8. Insights & Recommendations */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Observed Themes</Text>
          <Text style={s.bodyText}>{report.triggersAndGrowth}</Text>
        </View>

        <View style={[s.card, { borderColor: C.primary, borderWidth: 2 }]}>
          <Text style={[s.cardTitle, { color: C.primary }]}>Moving Forward</Text>
          <Text style={s.bodyText}>{report.recommendations}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, center: { justifyContent: 'center', alignItems: 'center' },
  navHeader: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#DDD' },
  backBtn: { paddingVertical: 5 }, backTxt: { fontSize: 16, color: C.primary, fontWeight: '600' },
  disclaimer: { backgroundColor: '#FFE4E1', color: '#B22222', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 20, textAlign: 'center' },
  header: { fontSize: 26, fontFamily: 'serif', color: C.text, marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: C.card, padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: C.text, marginBottom: 10 },
  bodyText: { fontSize: 15, color: '#444', lineHeight: 24 },
  subText: { fontSize: 12, color: C.muted, marginBottom: 15 },
  chart: { marginVertical: 8, borderRadius: 16, alignSelf: 'center' },
  error: { textAlign: 'center', marginTop: 50, color: C.muted }
});