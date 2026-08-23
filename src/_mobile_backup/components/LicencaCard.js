import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme/colors';
import { formatDate, getStatusConfig, getTipoLicencaConfig, getDaysUntilExpiry } from '../utils/formatters';

export function LicencaCard({ licenca, onPress }) {
  const statusConfig = getStatusConfig(licenca.status);
  const tipoConfig = getTipoLicencaConfig(licenca.tipoLicenca);
  const daysLeft = getDaysUntilExpiry(licenca.dataVencimento);
  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  const urgencyColor = isExpired
    ? Colors.error
    : isExpiringSoon
    ? Colors.warning
    : Colors.divider;

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.sm, { borderLeftColor: urgencyColor }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: Colors.primary + '12' }]}>
          <MaterialCommunityIcons
            name={tipoConfig.icon || 'file-document-outline'}
            size={20}
            color={Colors.primary}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.nome} numberOfLines={2}>{tipoConfig.label}</Text>
          <Text style={styles.codigo}>{licenca.codigo}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={styles.footer}>
        <View style={styles.metaLeft}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="tag-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{licenca.codigo}</Text>
          </View>
        </View>

        <View style={[
          styles.expiryChip,
          isExpired
            ? styles.expiryChipError
            : isExpiringSoon
            ? styles.expiryChipWarn
            : styles.expiryChipNormal,
        ]}>
          <MaterialCommunityIcons
            name={isExpired ? 'alert-circle' : 'calendar-clock'}
            size={12}
            color={isExpired ? Colors.error : isExpiringSoon ? Colors.warning : Colors.textTertiary}
          />
          <Text style={[
            styles.expiryText,
            isExpired
              ? { color: Colors.error }
              : isExpiringSoon
              ? { color: Colors.warning }
              : { color: Colors.textTertiary },
          ]}>
            {isExpired
              ? `Vencida há ${Math.abs(daysLeft)}d`
              : isExpiringSoon
              ? `Vence em ${daysLeft}d`
              : formatDate(licenca.dataVencimento)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
  },
  nome: {
    ...Typography.body2,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
    lineHeight: 18,
  },
  codigo: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    ...Typography.label,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  expiryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  expiryChipNormal: {
    backgroundColor: Colors.surfaceVariant,
  },
  expiryChipWarn: {
    backgroundColor: Colors.warningBg,
  },
  expiryChipError: {
    backgroundColor: Colors.errorBg,
  },
  expiryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
