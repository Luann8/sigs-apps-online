import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme/colors';

export function KpiCard({ label, value, icon, color, bgColor, subtitle, trend }) {
  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        {trend !== undefined && (
          <View style={[styles.trend, { backgroundColor: trend >= 0 ? Colors.successBg : Colors.errorBg }]}>
            <MaterialCommunityIcons
              name={trend >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend >= 0 ? Colors.success : Colors.error}
            />
          </View>
        )}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minWidth: 80,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textDisabled,
    marginTop: 2,
  },
});
