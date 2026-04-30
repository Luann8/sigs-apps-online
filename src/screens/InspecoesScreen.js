import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLicencasStore } from '../store/licencasStore';
import { InspecaoCard } from '../components/InspecaoCard';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function InspecoesScreen() {
  const { licencas } = useLicencasStore();

  const allInspecoes = useMemo(() => {
    const items = [];
    licencas.forEach((licenca) => {
      licenca.inspecoes.forEach((inspecao) => {
        items.push({
          id: inspecao.id,
          estabelecimento: licenca.nome,
          inspecao,
        });
      });
    });
    return items.sort((a, b) =>
      new Date(b.inspecao.data).getTime() - new Date(a.inspecao.data).getTime()
    );
  }, [licencas]);

  const aprovadas = allInspecoes.filter((i) => i.inspecao.resultado === 'aprovado').length;
  const reprovadas = allInspecoes.filter((i) => i.inspecao.resultado === 'reprovado').length;
  const pendentes = allInspecoes.filter((i) => i.inspecao.resultado === 'pendente').length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>SIGS</Text>
              <Text style={styles.appTagline}>Gestão Sanitária Digital</Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerTitle}>Inspeções</Text>
        <Text style={styles.headerSubtitle}>Histórico de fiscalizações</Text>

        <View style={styles.summaryRow}>
          <SummaryChip label="Aprovadas" count={aprovadas} color={Colors.success} />
          <SummaryChip label="Pendentes" count={pendentes} color={Colors.warning} />
          <SummaryChip label="Reprovadas" count={reprovadas} color={Colors.error} />
        </View>
      </LinearGradient>

      <FlatList
        data={allInspecoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InspecaoCard
            inspecao={item.inspecao}
            estabelecimento={item.estabelecimento}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-search-outline" size={60} color={Colors.textDisabled} />
            <Text style={styles.emptyTitle}>Nenhuma inspeção</Text>
          </View>
        }
      />
    </View>
  );
}

function SummaryChip({ label, count, color }) {
  return (
    <View style={[summaryStyles.chip, { borderColor: color + '40' }]}>
      <Text style={[summaryStyles.count, { color }]}>{count}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  count: { fontSize: 18, fontWeight: '800' },
  label: { ...Typography.caption, fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: { marginBottom: Spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  appName: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  appTagline: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  headerTitle: { ...Typography.h2, color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyTitle: { ...Typography.h4, color: Colors.textSecondary },
});
