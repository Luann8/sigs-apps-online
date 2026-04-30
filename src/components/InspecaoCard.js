import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/colors';
import { formatDate, getResultadoConfig } from '../utils/formatters';

export function InspecaoCard({ inspecao, estabelecimento }) {
  const resultadoConfig = getResultadoConfig(inspecao.resultado);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.resultIcon, { backgroundColor: resultadoConfig.color + '15' }]}>
          <MaterialCommunityIcons
            name={resultadoConfig.icon}
            size={20}
            color={resultadoConfig.color}
          />
        </View>
        <View style={styles.titleArea}>
          {estabelecimento && (
            <Text style={styles.estabelecimento} numberOfLines={1}>
              {estabelecimento}
            </Text>
          )}
          <Text style={styles.inspetor}>Inspetor: {inspecao.inspetor}</Text>
        </View>
        <View style={[styles.resultBadge, { backgroundColor: resultadoConfig.color + '15' }]}>
          <Text style={[styles.resultText, { color: resultadoConfig.color }]}>
            {resultadoConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(inspecao.data)}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="file-document-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{inspecao.protocolo}</Text>
        </View>
      </View>

      {inspecao.observacoes && (
        <Text style={styles.observacoes} numberOfLines={2}>
          {inspecao.observacoes}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleArea: {
    flex: 1,
  },
  estabelecimento: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  inspetor: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  resultText: {
    ...Typography.label,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  observacoes: {
    ...Typography.body2,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    lineHeight: 20,
  },
});
