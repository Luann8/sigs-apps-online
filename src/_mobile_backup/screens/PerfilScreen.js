import React, { useMemo } from 'react';
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
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { mockUsuario } from '../data/mockData';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';

export function PerfilScreen() {
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const licencas = useMemo(
    () => rawLicencas.map((l) => ({ ...l, id: l._id })),
    [rawLicencas]
  );
  const usuario = mockUsuario;

  const ativas = licencas.filter((l) => l.status === 'ativa').length;
  const pendentes = licencas.filter((l) => l.status === 'pendente').length;

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => Alert.alert('Encerrado', 'Sessão encerrada com sucesso.') },
    ]);
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#fff" />
          </View>
          <Text style={styles.appName}>SIGS</Text>
        </View>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{usuario.nome}</Text>
            <Text style={styles.userCargo}>{usuario.cargo}</Text>
            <View style={styles.crmvBadge}>
              <MaterialCommunityIcons name="certificate" size={12} color={Colors.primary} />
              <Text style={styles.crmvText}>{usuario.crmv}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{ativas}</Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{pendentes}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{licencas.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Contact info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Perfil</Text>
          <View style={styles.infoCard}>
            <ProfileRow icon="account-circle-outline" label="Nome" value={usuario.nome} />
            <ProfileRow icon="email-outline" label="E-mail" value={usuario.email} />
            <ProfileRow icon="badge-account-horizontal-outline" label="Cargo" value={usuario.cargo} />
            <ProfileRow icon="certificate-outline" label="CRMV" value={usuario.crmv} last />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <View style={styles.infoCard}>
            <SettingRow icon="bell-outline" label="Notificações de vencimento" />
            <SettingRow icon="shield-lock-outline" label="Privacidade e Segurança" />
            <SettingRow icon="help-circle-outline" label="Ajuda e Suporte" last />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <View style={styles.infoCard}>
            <ProfileRow icon="information-outline" label="Versão do App" value="1.0.0" />
            <ProfileRow icon="domain" label="Sistema" value="SIGS — Gestão Sanitária Digital" last />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ icon, label, value, last }) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} style={rowStyles.icon} />
      <View style={rowStyles.content}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

function SettingRow({ icon, label, last }) {
  return (
    <TouchableOpacity
      style={[rowStyles.row, !last && rowStyles.rowBorder]}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} style={rowStyles.icon} />
      <Text style={[rowStyles.value, { flex: 1 }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textDisabled} />
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  icon: { marginRight: Spacing.sm },
  content: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  value: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },
  appName: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { ...Typography.h3, color: '#fff', marginBottom: 2 },
  userCargo: { ...Typography.body2, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  crmvBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  crmvText: { ...Typography.caption, color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    marginBottom: Spacing.xl,
  },
  logoutText: { ...Typography.button, color: Colors.error },
});
