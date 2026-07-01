import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { api } from '../services/api';

export default function AdminScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    const ingestData = async () => {
        setLoading(true);
        try {
            // POST http://localhost:8084/api/admin/ingest-global-data
            const res = await api.post('/admin/ingest-global-data');
            Alert.alert("Success", res.data); // Should say "Global data ingestion started..."
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to trigger data ingestion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back to Dashboard</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>System Admin</Text>
                <Text style={styles.subtitle}>
                    Use this panel to manage backend RAG operations. Do not run ingestion multiple times unless the vector DB is wiped.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Global Vector Store</Text>
                    <Text style={styles.cardDesc}>
                        Reads CounselChat, Empathetic JSON, and CBT PDFs to populate the pgvector database for the AI Advisor context.
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, loading && {opacity: 0.7}]}
                        onPress={ingestData}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Run Data Ingestion</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef2e6' },
    header: { padding: 20 },
    backText: { fontSize: 16, color: '#5a7a52' },
    content: { padding: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1f2a1c', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#6b7a64', marginBottom: 30, lineHeight: 20 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#d7decd' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    cardDesc: { fontSize: 14, color: '#6b7a64', marginBottom: 20, lineHeight: 20 },
    button: { backgroundColor: '#d9534f', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});