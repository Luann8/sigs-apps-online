import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme/colors';
import { formatDate, getStatusConfig, getTipoConfig, getDaysUntilExpiry } from '../utils/formatters';

export function LicencaCard({ licenca, onPress }) {
  const statusConfig = getStatusConfig(licenca.status);
  const tipoConfig = getTipoConfig(licenca.tipo);
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
        <View style={[styles.iconWrap, { backgroundColor: tipoConfig.bg }]}>
          <MaterialCommunityIcons
            name={licenca.tipo === 'veterinaria' ? 'paw' : 'medical-bag'}
            size={20}
            color={tipoConfig.color}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.nome} numberOfLines={1}>{licenca.nome}</Text>
          <Text style={styles.endereco} numberOfLines={1}>{licenca.endereco}</Text>
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
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={licenca.tipo === 'veterinaria' ? 'paw' : 'medical-bag'}
              size={12}
              color={tipoConfig.color}
            />
            <Text style={[styles.metaText, { color: tipoConfig.color }]}>
              {tipoConfig.label}
            </Text>
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
    alignItems: 'center',
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
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  endereco: {
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
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textDisabled,
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
