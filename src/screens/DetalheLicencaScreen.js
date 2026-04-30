import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLicencasStore } from '../store/licencasStore';
import { InspecaoCard } from '../components/InspecaoCard';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { formatDate, getStatusConfig, getTipoConfig } from '../utils/formatters';

export function DetalheLicencaScreen({ route, navigation }) {
  const { id } = route.params;
  const { getLicencaById, updateLicenca, deleteLicenca } = useLicencasStore();
  const licenca = getLicencaById(id);

  if (!licenca) {
    return (
      <View style={styles.notFound}>
        <Text>Licença não encontrada</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(licenca.status);
  const tipoConfig = getTipoConfig(licenca.tipo);

  function handleRenovar() {
    Alert.alert(
      'Renovar Licença',
      `Deseja iniciar o processo de renovação para "${licenca.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            updateLicenca(id, { status: 'pendente' });
            Alert.alert('Sucesso', 'Processo de renovação iniciado. Status alterado para Pendente.');
            navigation.goBack();
          },
        },
      ]
    );
  }

  function handleExcluir() {
    Alert.alert(
      'Excluir Licença',
      'Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteLicenca(id);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
        {/* Header */}
        <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {licenca.nome}
          </Text>
          <Text style={styles.codigo}>{licenca.codigo}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type badge */}
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: tipoConfig.bg }]}>
            <MaterialCommunityIcons
              name={licenca.tipo === 'veterinaria' ? 'paw' : 'medical-bag'}
              size={16}
              color={tipoConfig.color}
            />
            <Text style={[styles.typeBadgeText, { color: tipoConfig.color }]}>
              Licença {tipoConfig.label}
            </Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Estabelecimento</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="domain" label="Razão Social" value={licenca.nome} />
            <InfoRow icon="map-marker-outline" label="Endereço" value={licenca.endereco} />
            <InfoRow icon="badge-account-outline" label="CNPJ" value={licenca.cnpj} />
            <InfoRow icon="phone-outline" label="Telefone" value={licenca.telefone} />
            <InfoRow icon="email-outline" label="E-mail" value={licenca.email} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsável Técnico</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="account-outline" label="Nome" value={licenca.responsavel} />
            {licenca.crmv && (
              <InfoRow icon="certificate-outline" label="CRMV" value={licenca.crmv} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validade da Licença</Text>
          <View style={styles.validadeRow}>
            <View style={styles.validadeCard}>
              <MaterialCommunityIcons name="calendar-check" size={22} color={Colors.success} />
              <Text style={styles.validadeLabel}>Emissão</Text>
              <Text style={styles.validadeValue}>{formatDate(licenca.dataEmissao)}</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={22} color={Colors.textDisabled} />
            <View style={styles.validadeCard}>
              <MaterialCommunityIcons name="calendar-remove" size={22} color={Colors.error} />
              <Text style={styles.validadeLabel}>Vencimento</Text>
              <Text style={[styles.validadeValue, { color: Colors.error }]}>
                {formatDate(licenca.dataVencimento)}
              </Text>
            </View>
          </View>
        </View>

        {/* Inspections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Histórico de Inspeções ({licenca.inspecoes.length})
          </Text>
          {licenca.inspecoes.length === 0 ? (
            <Text style={styles.noInspecoes}>Nenhuma inspeção registrada.</Text>
          ) : (
            licenca.inspecoes.map((inspecao) => (
              <InspecaoCard key={inspecao.id} inspecao={inspecao} />
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnRenovar} onPress={handleRenovar}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.btnRenovarText}>Renovar Licença</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.btnSecondary, styles.btnDanger]} onPress={handleExcluir}>
              <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
              <Text style={[styles.btnSecondaryText, { color: Colors.error }]}>Excluir Licença</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={infoStyles.row}>
      <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} style={infoStyles.icon} />
      <View style={infoStyles.content}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  icon: { marginRight: Spacing.sm, marginTop: 2 },
  content: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  value: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  backBtn: { marginBottom: Spacing.sm },
  headerContent: { gap: Spacing.xs },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  statusText: { ...Typography.label, color: '#fff' },
  headerTitle: { ...Typography.h2, color: '#fff', letterSpacing: -0.5 },
  codigo: { ...Typography.body2, color: 'rgba(255,255,255,0.75)' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },

  typeBadgeRow: { marginBottom: Spacing.md },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: { ...Typography.label },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noInspecoes: { ...Typography.body2, color: Colors.textDisabled },

  validadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  validadeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  validadeLabel: { ...Typography.caption, color: Colors.textSecondary },
  validadeValue: { ...Typography.h4, color: Colors.textPrimary },

  actions: { gap: Spacing.sm, marginTop: Spacing.md },
  btnRenovar: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  btnRenovarText: { ...Typography.button, color: '#fff', fontSize: 16 },
  secondaryActions: { flexDirection: 'row', gap: Spacing.sm },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnDanger: { borderColor: Colors.error + '40' },
  btnSecondaryText: { ...Typography.button, color: Colors.primary },
});
