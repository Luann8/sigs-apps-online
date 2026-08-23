import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAlertsStore } from '../store/alertsStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { formatDate } from '../utils/formatters';
import { buildAlertList } from '../utils/alertsHelper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPE_CONFIG = {
  critical: { color: Colors.error,   bg: Colors.errorBg,   label: 'Crítico'  },
  urgent:   { color: Colors.error,   bg: '#FFF0EC',         label: 'Urgente'  },
  warning:  { color: Colors.warning, bg: Colors.warningBg, label: 'Atenção'  },
  info:     { color: Colors.info,    bg: Colors.infoBg,    label: 'Info'     },
};

export function AlertasScreen({ navigation }) {
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const licencas = useMemo(
    () => rawLicencas.map((l) => ({ ...l, id: l._id })),
    [rawLicencas]
  );
  const { markAsSeen, isSeen } = useAlertsStore();
  const insets = useSafeAreaInsets();

  const alertas = useMemo(() => buildAlertList(licencas), [licencas]);

  const unseenCount = useMemo(
    () => alertas.filter((a) => !isSeen(a.id)).length,
    [alertas, isSeen]
  );

  // Marca todos os alertas visíveis como lidos ao abrir a tela
  useEffect(() => {
    if (alertas.length > 0) {
      markAsSeen(alertas.map((a) => a.id));
    }
  }, [alertas]);

  const criticalCount  = alertas.filter((a) => a.type === 'critical').length;
  const urgentCount    = alertas.filter((a) => a.type === 'urgent').length;
  const warningCount   = alertas.filter((a) => a.type === 'warning').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Linha topo: voltar + título + badge não lidos */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Alertas</Text>
            {unseenCount > 0 && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{unseenCount} novo{unseenCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {alertas.length > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{alertas.length}</Text>
            </View>
          )}
        </View>

        <Text style={styles.headerSubtitle}>
          {alertas.length === 0
            ? 'Nenhuma pendência ativa'
            : `${alertas.length} pendência${alertas.length > 1 ? 's' : ''} ativa${alertas.length > 1 ? 's' : ''}`}
        </Text>

        {/* Resumo por tipo */}
        {alertas.length > 0 && (
          <View style={styles.summaryRow}>
            {criticalCount > 0 && (
              <SummaryChip count={criticalCount} label="Vencidas" color={Colors.error} />
            )}
            {urgentCount > 0 && (
              <SummaryChip count={urgentCount} label="Urgentes" color="#FF6D3B" />
            )}
            {warningCount > 0 && (
              <SummaryChip count={warningCount} label="Em breve" color={Colors.warning} />
            )}
          </View>
        )}
      </LinearGradient>

      {/* Lista */}
      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
          const isNew = !isSeen(item.id);  // sempre false após useEffect, mas correto para SSR/render inicial

          return (
            <TouchableOpacity
              style={[
                styles.card,
                Shadows.sm,
                { borderLeftColor: cfg.color },
                isNew && styles.cardNew,
              ]}
              onPress={() => navigation.navigate('DetalheLicenca', { id: item.licencaId })}
              activeOpacity={0.75}
            >
              {/* Ponto de "não lido" */}
              {isNew && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}

              <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={cfg.color} />
              </View>

              <View style={styles.info}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: cfg.color }]}>{item.title}</Text>
                  {item.date && (
                    <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                  )}
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textDisabled} />
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          alertas.length > 0 ? (
            <Text style={styles.listHint}>
              Toque em um alerta para ver os detalhes da licença.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>Tudo em ordem!</Text>
            <Text style={styles.emptySubtitle}>
              Nenhuma licença vencida ou próxima do vencimento.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function SummaryChip({ count, label, color }) {
  return (
    <View style={[chipStyles.chip, { borderColor: color + '50' }]}>
      <Text style={[chipStyles.count, { color }]}>{count}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  count: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: { ...Typography.h2, color: '#fff' },
  newBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  newBadgeText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 11,
  },
  totalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },

  list: { padding: Spacing.md },
  listHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    gap: Spacing.sm,
  },
  cardNew: {
    backgroundColor: '#FAFCFF',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: { ...Typography.label, fontSize: 13 },
  cardDate: { ...Typography.caption, color: Colors.textTertiary },
  cardSubtitle: {
    ...Typography.body2,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardDesc: { ...Typography.caption, color: Colors.textTertiary },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
