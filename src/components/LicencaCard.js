import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/colors';
import { formatDate, getStatusConfig, getTipoConfig, getDaysUntilExpiry } from '../utils/formatters';

export function LicencaCard({ licenca, onPress }) {
  const statusConfig = getStatusConfig(licenca.status);
  const tipoConfig = getTipoConfig(licenca.tipo);
  const daysLeft = getDaysUntilExpiry(licenca.dataVencimento);
  const expiringSoon = daysLeft <= 30 && daysLeft > 0;

  const statusIcon =
    licenca.status === 'ativa'
      ? 'check-circle'
      : licenca.status === 'pendente'
      ? 'clock-outline'
      : licenca.status === 'vencida'
      ? 'alert-circle'
      : 'minus-circle';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {expiringSoon && (
        <View style={styles.expiryBanner}>
          <MaterialCommunityIcons name="alert" size={12} color={Colors.warning} />
          <Text style={styles.expiryText}>Vence em {daysLeft} dias</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={licenca.tipo === 'veterinaria' ? 'paw' : 'medical-bag'}
            size={22}
            color={tipoConfig.color}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.nome} numberOfLines={1}>
            {licenca.nome}
          </Text>
          <Text style={styles.endereco} numberOfLines={1}>
            {licenca.endereco}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={statusIcon}
          size={24}
          color={statusConfig.color}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: tipoConfig.bg }]}>
            <Text style={[styles.badgeText, { color: tipoConfig.color }]}>
              {tipoConfig.label}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.badgeText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(licenca.dataVencimento)}</Text>
        </View>
      </View>

      <View style={styles.codigoRow}>
        <Text style={styles.codigo}>Código: {licenca.codigo}</Text>
        {licenca.crmv && (
          <Text style={styles.crmv}>{licenca.crmv}</Text>
        )}
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
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  expiryText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nome: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  endereco: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.label,
    fontSize: 11,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  codigoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  codigo: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  crmv: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
});
