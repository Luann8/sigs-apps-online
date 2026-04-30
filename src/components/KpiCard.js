import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/colors';

export function KpiCard({ label, value, icon, color, bgColor, subtitle }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 80,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: 2,
  },
});
