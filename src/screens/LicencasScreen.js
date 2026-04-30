import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLicencasStore } from '../store/licencasStore';
import { LicencaCard } from '../components/LicencaCard';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { generateId, generateCodigo } from '../utils/formatters';

const TIPO_OPTIONS = [
  { key: 'todas', label: 'Todas', icon: 'layers-outline' },
  { key: 'sanitaria', label: 'Sanitária', icon: 'medical-bag' },
  { key: 'veterinaria', label: 'Veterinária', icon: 'paw' },
];

const STATUS_OPTIONS = [
  { key: 'todas', label: 'Todos' },
  { key: 'ativa', label: 'Ativas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'vencida', label: 'Vencidas' },
  { key: 'suspensa', label: 'Suspensas' },
];

export function LicencasScreen({ navigation }) {
  const {
    setSearchQuery,
    setFilterTipo,
    setFilterStatus,
    filterTipo,
    filterStatus,
    searchQuery,
    loadLicencas,
    licencas
  } = useLicencasStore();

  const getFilteredLicencas = useLicencasStore((s) => s.getFilteredLicencas);
  const filtered = getFilteredLicencas();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    loadLicencas();
  }, []);

  function handleSearch(text) {
    setLocalSearch(text);
    setSearchQuery(text);
  }

  function handleGerarDadosTeste() {
    const { addLicenca } = useLicencasStore.getState();
    const l1 = {
      id: generateId(), codigo: generateCodigo((licencas?.length || 0) + 1), nome: 'Clínica Vet Dogs', cnpj: '11222333000144', endereco: 'Rua das Flores, 123',
      telefone: '(11) 99999-9999', email: 'contato@vetdogs.com', responsavel: 'Dr. João', crmv: '12345',
      tipo: 'veterinaria', status: 'pendente', dataEmissao: new Date().toISOString().split('T')[0], dataVencimento: '2026-12-31', inspecoes: []
    };
    const l2 = {
      id: generateId(), codigo: generateCodigo((licencas?.length || 0) + 2), nome: 'Supermercado Central', cnpj: '44555666000177', endereco: 'Av. Paulista, 1000',
      telefone: '(11) 88888-8888', email: 'contato@central.com', responsavel: 'Maria Silva', crmv: undefined,
      tipo: 'sanitaria', status: 'ativa', dataEmissao: new Date().toISOString().split('T')[0], dataVencimento: '2025-06-30', inspecoes: []
    };
    try {
      addLicenca(l1);
      addLicenca(l2);
      Alert.alert('Sucesso', 'Dados de teste gerados com sucesso!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao gerar dados: ' + e.message);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header Padronizado */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >



        <Text style={styles.headerTitle}>Licenças</Text>
        <Text style={styles.headerSubtitle}>Gerencie os registros sanitários</Text>

        {/* Search Bar no Header */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estabelecimento..."
            placeholderTextColor={Colors.textDisabled}
            value={localSearch}
            onChangeText={handleSearch}
          />
        </View>
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TIPO_OPTIONS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterTipo(item.key)}
              style={[
                styles.filterChip,
                filterTipo === item.key && styles.filterChipActive
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={16}
                color={filterTipo === item.key ? '#fff' : Colors.textSecondary}
              />
              <Text style={[
                styles.filterChipLabel,
                filterTipo === item.key && styles.filterChipLabelActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterStatus(item.key)}
              style={[
                styles.statusChip,
                filterStatus === item.key && styles.statusChipActive
              ]}
            >
              <Text style={[
                styles.statusChipLabel,
                filterStatus === item.key && styles.statusChipLabelActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={[styles.filterList, { marginTop: 10 }]}
        />
      </View>

      {/* Listagem */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LicencaCard
            licenca={item}
            onPress={() => navigation.navigate('DetalheLicenca', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color={Colors.textDisabled} />
            <Text style={styles.emptyText}>Nenhuma licença encontrada.</Text>
            {(!licencas || licencas.length === 0) && (
              <TouchableOpacity style={styles.gerarDadosBtn} onPress={handleGerarDadosTeste}>
                <MaterialCommunityIcons name="database-plus" size={20} color="#fff" />
                <Text style={styles.gerarDadosText}>Gerar Dados de Teste</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.emptySubtitle}>
              Tente ajustar seus filtros de busca
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
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
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
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { ...Typography.h2, color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    ...Typography.body2,
    color: Colors.textPrimary,
  },
  filterSection: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipLabel: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterChipLabelActive: {
    color: '#fff',
  },
  statusChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  statusChipLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusChipLabelActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textDisabled,
    marginTop: Spacing.xs,
  },
  emptyText: {
    ...Typography.body1,
    color: Colors.textDisabled,
    marginTop: Spacing.md,
  },
  gerarDadosBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  gerarDadosText: {
    ...Typography.button,
    color: '#fff',
  }
});
