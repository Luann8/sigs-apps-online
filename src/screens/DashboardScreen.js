import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLicencasStore } from '../store/licencasStore';
import { KpiCard } from '../components/KpiCard';
import { LicencaCard } from '../components/LicencaCard';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { getDaysUntilExpiry } from '../utils/formatters';

export function DashboardScreen({ navigation }) {
  const { licencas } = useLicencasStore();

  const stats = useMemo(() => {
    const total = licencas.length;
    const ativas = licencas.filter((l) => l.status === 'ativa').length;
    const pendentes = licencas.filter((l) => l.status === 'pendente').length;
    const vencidas = licencas.filter((l) => l.status === 'vencida').length;
    const suspensas = licencas.filter((l) => l.status === 'suspensa').length;
    const vencendo = licencas.filter((l) => {
      const days = getDaysUntilExpiry(l.dataVencimento);
      return days <= 30 && days > 0 && l.status === 'ativa';
    }).length;
    const veterinarias = licencas.filter((l) => l.tipo === 'veterinaria').length;
    const sanitarias = licencas.filter((l) => l.tipo === 'sanitaria').length;
    return { total, ativas, pendentes, vencidas, suspensas, vencendo, veterinarias, sanitarias };
  }, [licencas]);

  const recentes = licencas.slice(0, 4);
  const alertas = licencas.filter((l) => {
    const days = getDaysUntilExpiry(l.dataVencimento);
    return (days <= 30 && days > 0 && l.status === 'ativa') || l.status === 'pendente' || l.status === 'suspensa';
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Visão geral das licenças</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.kpiRow}>
            <KpiCard
              label="Total"
              value={stats.total}
              icon="clipboard-list-outline"
              color={Colors.secondary}
              bgColor={Colors.infoBg}
            />
            <KpiCard
              label="Ativas"
              value={stats.ativas}
              icon="check-circle-outline"
              color={Colors.success}
              bgColor={Colors.successBg}
            />
          </View>
          <View style={styles.kpiRow}>
            <KpiCard
              label="Pendentes"
              value={stats.pendentes}
              icon="clock-outline"
              color={Colors.warning}
              bgColor={Colors.warningBg}
            />
            <KpiCard
              label="Vencidas"
              value={stats.vencidas}
              icon="alert-circle-outline"
              color={Colors.error}
              bgColor={Colors.errorBg}
            />
          </View>
        </View>

        {/* Type breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por Tipo</Text>
          <View style={styles.typeRow}>
            <View style={[styles.typeCard, { borderColor: Colors.veterinaria }]}>
              <MaterialCommunityIcons name="paw" size={28} color={Colors.veterinaria} />
              <Text style={[styles.typeValue, { color: Colors.veterinaria }]}>
                {stats.veterinarias}
              </Text>
              <Text style={styles.typeLabel}>Veterinárias</Text>
            </View>
            <View style={[styles.typeCard, { borderColor: Colors.sanitaria }]}>
              <MaterialCommunityIcons name="medical-bag" size={28} color={Colors.sanitaria} />
              <Text style={[styles.typeValue, { color: Colors.sanitaria }]}>
                {stats.sanitarias}
              </Text>
              <Text style={styles.typeLabel}>Sanitárias</Text>
            </View>
            <View style={[styles.typeCard, { borderColor: Colors.warning }]}>
              <MaterialCommunityIcons name="calendar-alert" size={28} color={Colors.warning} />
              <Text style={[styles.typeValue, { color: Colors.warning }]}>
                {stats.vencendo}
              </Text>
              <Text style={styles.typeLabel}>Vencendo</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {alertas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Alertas</Text>
            {alertas.slice(0, 3).map((licenca) => {
              const days = getDaysUntilExpiry(licenca.dataVencimento);
              const isExpiring = days <= 30 && days > 0;
              return (
                <TouchableOpacity
                  key={licenca.id}
                  style={styles.alertCard}
                  onPress={() => navigation.navigate('DetalheLicenca', { id: licenca.id })}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isExpiring ? 'calendar-alert' : licenca.status === 'pendente' ? 'clock-alert' : 'alert-octagon'}
                    size={20}
                    color={isExpiring ? Colors.warning : licenca.status === 'pendente' ? Colors.warning : Colors.error}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertNome} numberOfLines={1}>{licenca.nome}</Text>
                    <Text style={styles.alertInfo}>
                      {isExpiring
                        ? `Vence em ${days} dias`
                        : licenca.status === 'pendente'
                        ? 'Documentação pendente'
                        : licenca.status === 'suspensa'
                        ? 'Licença suspensa'
                        : 'Licença vencida'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Licenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Licencas')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {recentes.map((licenca) => (
            <LicencaCard
              key={licenca.id}
              licenca={licenca}
              onPress={() =>
                navigation.navigate('DetalheLicenca', { id: licenca.id })
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  headerTitle: { ...Typography.h2, color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { ...Typography.body2, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 120 },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  seeAll: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },

  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },

  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  typeValue: { fontSize: 26, fontWeight: '700', marginTop: 6, marginBottom: 2 },
  typeLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  alertContent: { flex: 1 },
  alertNome: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  alertInfo: { ...Typography.caption, color: Colors.warning },
});
