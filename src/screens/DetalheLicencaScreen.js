import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLicencasStore } from '../store/licencasStore';
import { InspecaoCard } from '../components/InspecaoCard';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { formatDate, getStatusConfig, getTipoConfig, getDaysUntilExpiry } from '../utils/formatters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DetalheLicencaScreen({ route, navigation }) {
  const { id } = route.params;
  const { getLicencaById, deleteLicenca } = useLicencasStore();
  const licenca = getLicencaById(id);
  const insets = useSafeAreaInsets();

  if (!licenca) {
    return (
      <View style={styles.notFound}>
        <MaterialCommunityIcons name="file-search-outline" size={48} color={Colors.textDisabled} />
        <Text style={styles.notFoundText}>Licença não encontrada</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(licenca.status);
  const tipoConfig = getTipoConfig(licenca.tipo);
  const daysLeft = getDaysUntilExpiry(licenca.dataVencimento);
  const isExpired = daysLeft <= 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;

  const urgencyColor = isExpired ? Colors.error : isExpiringSoon ? Colors.warning : Colors.success;
  const urgencyMsg = isExpired
    ? `Vencida há ${Math.abs(daysLeft)} dia${Math.abs(daysLeft) !== 1 ? 's' : ''}`
    : isExpiringSoon
    ? `Vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`
    : `${daysLeft} dias restantes`;

  function handleExcluir() {
    Alert.alert(
      'Excluir Licença',
      `Tem certeza que deseja excluir "${licenca.nome}"? Esta ação não pode ser desfeita.`,
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
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.color }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={2}>{licenca.nome}</Text>
          <Text style={styles.codigo}>{licenca.codigo}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency + type banner */}
        <View style={styles.bannerRow}>
          <View style={[styles.typeBadge, { backgroundColor: tipoConfig.bg }]}>
            <MaterialCommunityIcons
              name={licenca.tipo === 'veterinaria' ? 'paw' : 'medical-bag'}
              size={14}
              color={tipoConfig.color}
            />
            <Text style={[styles.typeBadgeText, { color: tipoConfig.color }]}>
              Licença {tipoConfig.label}
            </Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '18' }]}>
            <MaterialCommunityIcons
              name={isExpired ? 'alert-circle' : 'clock-outline'}
              size={13}
              color={urgencyColor}
            />
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>{urgencyMsg}</Text>
          </View>
        </View>

        {/* Validity card */}
        <View style={[styles.validadeCard, Shadows.sm]}>
          <ValidadeItem
            icon="calendar-check"
            label="Emissão"
            value={formatDate(licenca.dataEmissao)}
            color={Colors.success}
          />
          <View style={styles.validadeArrow}>
            <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.textDisabled} />
          </View>
          <ValidadeItem
            icon="calendar-remove"
            label="Vencimento"
            value={formatDate(licenca.dataVencimento)}
            color={urgencyColor}
            highlight
          />
        </View>

        {/* Custo */}
        {licenca.custo != null && (
          <View style={[styles.custoCard, Shadows.sm]}>
            <View style={styles.custoIconWrap}>
              <MaterialCommunityIcons name="currency-brl" size={22} color={Colors.primary} />
            </View>
            <View style={styles.custoContent}>
              <Text style={styles.custoLabel}>Custo da Licença</Text>
              <Text style={styles.custoValue}>
                {Number(licenca.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
            </View>
          </View>
        )}

        {/* Establishment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estabelecimento</Text>
          <View style={[styles.infoCard, Shadows.sm]}>
            <InfoRow icon="domain" label="Razão Social" value={licenca.nome} />
            <InfoRow icon="map-marker-outline" label="Endereço" value={licenca.endereco} />
            <InfoRow icon="card-account-details-outline" label="CNPJ" value={licenca.cnpj} />
            {licenca.telefone && licenca.telefone !== '—' && (
              <InfoRow icon="phone-outline" label="Telefone" value={licenca.telefone} />
            )}
            {licenca.email && licenca.email !== '—' && (
              <InfoRow icon="email-outline" label="E-mail" value={licenca.email} last />
            )}
          </View>
        </View>

        {/* Responsible */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsável Técnico</Text>
          <View style={[styles.infoCard, Shadows.sm]}>
            <InfoRow icon="account-outline" label="Nome" value={licenca.responsavel} />
            {licenca.crmv ? (
              <InfoRow icon="certificate-outline" label="CRMV" value={licenca.crmv} last />
            ) : null}
          </View>
        </View>

        {/* Attachment */}
        {licenca.anexoUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documento anexo</Text>
            <View style={[styles.anexoWrap, Shadows.sm]}>
              <Image source={{ uri: licenca.anexoUri }} style={styles.anexoImage} />
            </View>
          </View>
        )}

        {/* Inspections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inspeções</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{licenca.inspecoes.length}</Text>
            </View>
          </View>
          {licenca.inspecoes.length === 0 ? (
            <View style={styles.noInspecoes}>
              <MaterialCommunityIcons name="clipboard-search-outline" size={32} color={Colors.textDisabled} />
              <Text style={styles.noInspecoesText}>Nenhuma inspeção registrada.</Text>
            </View>
          ) : (
            licenca.inspecoes.map((inspecao) => (
              <InspecaoCard key={inspecao.id} inspecao={inspecao} />
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('EditarLicenca', { licencaId: id })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" />
              <Text style={styles.btnPrimaryText}>Editar / Renovar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDanger} onPress={handleExcluir} activeOpacity={0.8}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
            <Text style={styles.btnDangerText}>Excluir licença</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[infoStyles.row, !last && infoStyles.rowBorder]}>
      <View style={infoStyles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={infoStyles.content}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

function ValidadeItem({ icon, label, value, color, highlight }) {
  return (
    <View style={valStyles.item}>
      <View style={[valStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={valStyles.label}>{label}</Text>
      <Text style={[valStyles.value, highlight && { color }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconWrap: {
    width: 30,
    alignItems: 'center',
    marginTop: 2,
    marginRight: Spacing.sm,
  },
  content: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textTertiary, marginBottom: 2 },
  value: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '500' },
});

const valStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600' },
  value: { ...Typography.h4, color: Colors.textPrimary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  notFoundText: { ...Typography.body1, color: Colors.textSecondary },

  header: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  headerContent: { gap: Spacing.xs },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 5,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  statusText: { ...Typography.label, color: '#fff', fontSize: 12 },
  headerTitle: { ...Typography.h2, color: '#fff' },
  codigo: { ...Typography.body2, color: 'rgba(255,255,255,0.65)' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },

  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: { ...Typography.label },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  urgencyText: { ...Typography.label, fontWeight: '700' },

  validadeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  validadeArrow: { paddingHorizontal: Spacing.sm },

  custoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  custoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  custoContent: { flex: 1 },
  custoLabel: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600', marginBottom: 2 },
  custoValue: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { ...Typography.label, color: Colors.textTertiary, fontSize: 11 },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },

  noInspecoes: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  noInspecoesText: { ...Typography.body2, color: Colors.textTertiary },

  anexoWrap: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  anexoImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  btnPrimary: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: Spacing.sm,
  },
  btnPrimaryText: { ...Typography.button, color: '#fff', fontSize: 16 },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  btnDangerText: { ...Typography.button, color: Colors.error, fontSize: 14 },
});
