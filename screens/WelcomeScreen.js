import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#f5f0e8', '#eef2e6', '#f5f0e8']}
      style={styles.container}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>A SAFE SPACE</Text>
        </View>
        <Text style={styles.stepText}>1 / 3</Text>
      </View>

      {/* Calm person image */}
      <View style={styles.imageWrapper}>
        <Image
          source={require('../assets/calm-person.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>It's okay to</Text>
      <Text style={styles.titleItalic}>not be okay</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        You don't have to go through this alone. Take a breath — we're right here with you.
      </Text>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Let us help you  →</Text>
      </TouchableOpacity>


      {/* Page indicator */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5a7a5a',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#6b7c6b',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    color: '#8a9a8a',
  },
  imageWrapper: {
    marginTop: 10,
    marginBottom: 10,
  },
  image: {
    width: 220,
    height: 220,
  },
  title: {
    fontSize: 36,
    color: '#2e3d2e',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  titleItalic: {
    fontSize: 40,
    color: '#5a7a5a',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'serif',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#7a8a7a',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#5a7a5a',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#5a7a5a',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  buttonText: {
    color: '#f5f0e8',
    fontSize: 17,
    fontWeight: '600',
  },
  laterText: {
    fontSize: 14,
    color: '#8a9a8a',
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(90,122,90,0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#5a7a5a',
  },
});
