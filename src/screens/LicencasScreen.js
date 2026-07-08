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
import { LicencaCard } from '../components/LicencaCard';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { generateId, generateCodigo } from '../utils/formatters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TIPO_OPTIONS = [
  { key: 'todas', label: 'Todas', icon: 'layers-outline' },
  { key: 'sanitaria', label: 'Sanitária', icon: 'medical-bag' },
  { key: 'veterinaria', label: 'Veterinária', icon: 'paw' },
];

const STATUS_OPTIONS = [
  { key: 'todas', label: 'Todas' },
  { key: 'ativa', label: 'Ativas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'vencida', label: 'Vencidas' },
  { key: 'suspensa', label: 'Suspensas' },
];

function FilterChip({ option, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress(option.key);
      }}
      style={[styles.chip, selected && styles.chipActive]}
      activeOpacity={0.75}
    >
      {option.icon && (
        <MaterialCommunityIcons
          name={option.icon}
          size={14}
          color={selected ? '#fff' : Colors.textSecondary}
        />
      )}
      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

export function LicencasScreen({ navigation }) {
  const {
    setSearchQuery,
    setFilterTipo,
    setFilterStatus,
    filterTipo,
    filterStatus,
    searchQuery,
    loadLicencas,
    licencas,
  } = useLicencasStore();

  const getFilteredLicencas = useLicencasStore((s) => s.getFilteredLicencas);
  const filtered = getFilteredLicencas();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadLicencas();
  }, []);

  function handleSearch(text) {
    setLocalSearch(text);
    setSearchQuery(text);
  }

  function handleGerarDadosTeste() {
    const { addLicenca } = useLicencasStore.getState();
    const base = licencas?.length || 0;
    const l1 = {
      id: generateId(), codigo: generateCodigo(base + 1), nome: 'Clínica Vet Dogs',
      cnpj: '11222333000144', endereco: 'Rua das Flores, 123', telefone: '(11) 99999-9999',
      email: 'contato@vetdogs.com', responsavel: 'Dr. João', crmv: '12345',
      tipo: 'veterinaria', status: 'pendente',
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: '2026-12-31', inspecoes: [],
    };
    const l2 = {
      id: generateId(), codigo: generateCodigo(base + 2), nome: 'Supermercado Central',
      cnpj: '44555666000177', endereco: 'Av. Paulista, 1000', telefone: '(11) 88888-8888',
      email: 'contato@central.com', responsavel: 'Maria Silva',
      tipo: 'sanitaria', status: 'ativa',
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: '2025-06-30', inspecoes: [],
    };
    try {
      addLicenca(l1);
      addLicenca(l2);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Dados gerados', text2: 'Dados de teste criados.' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro', text2: e.message });
    }
  }

  const activeFilters = (filterTipo !== 'todas' ? 1 : 0) + (filterStatus !== 'todas' ? 1 : 0);

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
          <View>
            <Text style={styles.headerTitle}>Licenças</Text>
            <Text style={styles.headerSubtitle}>
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
              {activeFilters > 0 ? ` · ${activeFilters} filtro${activeFilters > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou código..."
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
          data={TIPO_OPTIONS}
          keyExtractor={(item) => `tipo-${item.key}`}
          renderItem={({ item }) => (
            <FilterChip
              option={item}
              selected={filterTipo === item.key}
              onPress={setFilterTipo}
            />
          )}
          contentContainerStyle={styles.filterRow}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_OPTIONS}
          keyExtractor={(item) => `status-${item.key}`}
          renderItem={({ item }) => (
            <FilterChip
              option={item}
              selected={filterStatus === item.key}
              onPress={setFilterStatus}
            />
          )}
          contentContainerStyle={[styles.filterRow, styles.filterRowSecond]}
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
            {(!licencas || licencas.length === 0) ? (
              <>
                <Text style={styles.emptySubtitle}>
                  Cadastre a primeira licença usando o botão "+" abaixo.
                </Text>
                <TouchableOpacity style={styles.gerarBtn} onPress={handleGerarDadosTeste}>
                  <MaterialCommunityIcons name="database-plus" size={18} color="#fff" />
                  <Text style={styles.gerarBtnText}>Gerar dados de teste</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptySubtitle}>
                Tente ajustar os filtros ou a busca.
              </Text>
            )}
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
  headerSubtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

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

  filtersWrap: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.sm,
  },
  filterRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterRowSecond: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
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
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipLabel: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipLabelActive: {
    color: '#fff',
  },

  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

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
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  gerarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  gerarBtnText: {
    ...Typography.button,
    color: '#fff',
    fontSize: 13,
  },
});
