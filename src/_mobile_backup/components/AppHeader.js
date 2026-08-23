import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography } from '../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function AppHeader({ title, subtitle, rightComponent }) {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.appName}>SIGS</Text>
            <Text style={styles.appSubtitle}>Gestão Sanitária Digital</Text>
          </View>
        </View>
        {rightComponent}
      </View>
      <View style={styles.titleArea}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  appName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  appSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  titleArea: {},
  title: {
    ...Typography.h2,
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
