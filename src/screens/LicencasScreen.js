import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useLicencasStore } from '../store/licencasStore';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlertsStore } from '../store/alertsStore';
import { buildAlertList } from '../utils/alertsHelper';
import { getTipoLicencaConfig, getStatusConfig, getDaysUntilExpiry, formatDate, generateId, generateCodigo } from '../utils/formatters';

const STATUS_OPTIONS = [
  { key: 'todas',    label: 'Todas' },
  { key: 'ativa',    label: 'Ativas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'vencida',  label: 'Vencidas' },
  { key: 'suspensa', label: 'Suspensas' },
];

function FilterChip({ option, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onPress(option.key); }}
      style={[styles.chip, selected && styles.chipActive]}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

function LicencaCard({ licenca, onPress }) {
  const tipo = getTipoLicencaConfig(licenca.tipoLicenca);
  const statusCfg = getStatusConfig(licenca.status);
  const days = getDaysUntilExpiry(licenca.dataVencimento);
  const isExpired = days <= 0;
  const isWarn = days > 0 && days <= 30;
  const urgencyColor = isExpired ? Colors.error : isWarn ? Colors.warning : Colors.success;

  return (
    <TouchableOpacity
      style={[styles.licCard, Shadows.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.licCardAccent, { backgroundColor: urgencyColor }]} />
      <View style={styles.licCardBody}>
        <View style={styles.licIconWrap}>
          <MaterialCommunityIcons name={tipo.icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.licInfo}>
          <Text style={styles.licNome} numberOfLines={2}>{tipo.label}</Text>
          <View style={styles.licMeta}>
            <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.licData}>Vence {formatDate(licenca.dataVencimento)}</Text>
            <View style={[styles.licStatusPill, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.licStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.licRight}>
          <Text style={[styles.licDias, { color: urgencyColor }]}>
            {isExpired ? `${Math.abs(days)}d` : `${days}d`}
          </Text>
          <Text style={[styles.licDiasLabel, { color: urgencyColor }]}>
            {isExpired ? 'vencida' : 'restantes'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textDisabled} style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function LicencasScreen({ navigation }) {
  const {
    setSearchQuery,
    setFilterStatus,
    filterStatus,
    searchQuery,
    loadLicencas,
    licencas,
  } = useLicencasStore();

  const estabelecimentoAtual = useEstabelecimentosStore((s) => s.estabelecimentoAtual);
  const getFilteredLicencas = useLicencasStore((s) => s.getFilteredLicencas);
  const filtered = getFilteredLicencas();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const insets = useSafeAreaInsets();

  const { countUnseen } = useAlertsStore();
  const alertas = buildAlertList(licencas);
  const unseenCount = countUnseen(alertas);
  const hasCritical = alertas.some((a) => a.type === 'expired');

  useEffect(() => {
    if (estabelecimentoAtual?.id) {
      loadLicencas(estabelecimentoAtual.id);
    }
  }, [estabelecimentoAtual?.id]);

  function handleSearch(text) {
    setLocalSearch(text);
    setSearchQuery(text);
  }

  const activeFilters = filterStatus !== 'todas' ? 1 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Licenças</Text>
            {estabelecimentoAtual && (
              <Text style={styles.headerEstab} numberOfLines={1}>{estabelecimentoAtual.nome}</Text>
            )}
            <Text style={styles.headerSubtitle}>
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
              {activeFilters > 0 ? ` · ${activeFilters} filtro${activeFilters > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bellBtn, hasCritical && styles.bellBtnCritical]}
            onPress={() => navigation.navigate('Alertas')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={hasCritical ? 'bell-ring' : unseenCount > 0 ? 'bell-badge-outline' : 'bell-outline'}
              size={20}
              color="#fff"
            />
            {unseenCount > 0 && (
              <View style={styles.unseenBadge}>
                <Text style={styles.unseenBadgeText}>{unseenCount > 9 ? '9+' : unseenCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por tipo de licença..."
            placeholderTextColor={Colors.textDisabled}
            value={localSearch}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {localSearch.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_OPTIONS}
          keyExtractor={(item) => `status-${item.key}`}
          renderItem={({ item }) => (
            <FilterChip option={item} selected={filterStatus === item.key} onPress={setFilterStatus} />
          )}
          contentContainerStyle={[styles.filterRow, { paddingVertical: Spacing.sm }]}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LicencaCard
            licenca={item}
            onPress={() => navigation.navigate('DetalheLicenca', { id: item.id })}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={40} color={Colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma licença encontrada</Text>
            <Text style={styles.emptySubtitle}>
              {!licencas || licencas.length === 0
                ? 'Cadastre a primeira licença usando o botão "+" abaixo.'
                : 'Tente ajustar os filtros ou a busca.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: '#fff' },
  headerEstab: { ...Typography.body2, color: 'rgba(255,255,255,0.85)', marginTop: 1, fontWeight: '600' },
  headerSubtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body2,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bellBtnCritical: { backgroundColor: Colors.error, borderColor: 'transparent' },
  unseenBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.gradientEnd,
  },
  unseenBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  filtersWrap: { backgroundColor: Colors.background },
  filterRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 5,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel: { ...Typography.label, fontSize: 12, color: Colors.textSecondary },
  chipLabelActive: { color: '#fff' },

  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  // Licença card (inline, simpler)
  licCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  licCardAccent: { width: 5 },
  licCardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  licIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  licInfo: { flex: 1, gap: 4 },
  licNome: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '700', lineHeight: 19 },
  licMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  licData: { ...Typography.caption, color: Colors.textTertiary },
  licStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  licStatusText: { ...Typography.label, fontSize: 10, fontWeight: '700' },
  licRight: { alignItems: 'center', minWidth: 56, flexShrink: 0 },
  licDias: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  licDiasLabel: { fontSize: 10, fontWeight: '600' },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { ...Typography.h4, color: Colors.textSecondary },
  emptySubtitle: { ...Typography.body2, color: Colors.textTertiary, textAlign: 'center' },
});
