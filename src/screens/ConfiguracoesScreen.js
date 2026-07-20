import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useLicencasStore } from '../store/licencasStore';
import { reagendarTodasAsNotificacoes } from '../utils/notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlertsStore } from '../store/alertsStore';
import { buildAlertList } from '../utils/alertsHelper';

const OPCOES_DIAS = [1, 3, 7, 15, 30];

export function ConfiguracoesScreen() {
  const {
    alertasAtivos,
    diasAntecedencia,
    setAlertasAtivos,
    setDiasAntecedencia,
    setHasSeenTutorial,
  } = useSettingsStore();
  const licencas = useLicencasStore((s) => s.licencas);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const { countUnseen } = useAlertsStore();
  const alertas = buildAlertList(licencas);
  const unseenCount = countUnseen(alertas);
  const hasCritical = alertas.some((a) => a.type === 'expired');

  const handleStartTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenTutorial(false);
    navigation.navigate('Inicio');
  };

  const handleToggleAlertas = async (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlertasAtivos(value);
    await reagendarTodasAsNotificacoes(licencas);
  };

  const handleSelectDias = async (dias) => {
    Haptics.selectionAsync();
    setDiasAntecedencia(dias);
    if (alertasAtivos) {
      await reagendarTodasAsNotificacoes(licencas);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Configurações</Text>
            <Text style={styles.headerSubtitle}>Preferências do sistema</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.bellBtn,
              hasCritical && styles.bellBtnCritical,
            ]}
            onPress={() => navigation.navigate('Alertas')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={
                hasCritical
                  ? 'bell-ring'
                  : unseenCount > 0
                  ? 'bell-badge-outline'
                  : 'bell-outline'
              }
              size={20}
              color="#fff"
            />
            {unseenCount > 0 && (
              <View style={styles.unseenBadge}>
                <Text style={styles.unseenBadgeText}>
                  {unseenCount > 9 ? '9+' : unseenCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications toggle */}
        <Text style={styles.groupLabel}>Notificações</Text>
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: alertasAtivos ? Colors.primaryLight + '30' : Colors.surfaceVariant }]}>
              <MaterialCommunityIcons
                name={alertasAtivos ? 'bell-ring' : 'bell-off-outline'}
                size={22}
                color={alertasAtivos ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Alertas de vencimento</Text>
              <Text style={styles.settingDesc}>
                {alertasAtivos ? 'Alertas ativados' : 'Alertas desativados'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={alertasAtivos ? Colors.primary : '#f4f3f4'}
              ios_backgroundColor={Colors.border}
              onValueChange={handleToggleAlertas}
              value={alertasAtivos}
            />
          </View>
        </View>

        {/* Antecedência */}
        <Text style={[styles.groupLabel, !alertasAtivos && styles.dimmed]}>
          Antecedência do alerta
        </Text>
        <View style={[styles.card, Shadows.sm, !alertasAtivos && styles.cardDisabled]}>
          <Text style={[styles.antecDesc, !alertasAtivos && styles.dimmed]}>
            Avise-me com quantos dias de antecedência antes do vencimento de uma licença?
          </Text>
          <View style={styles.diasGrid}>
            {OPCOES_DIAS.map((dias) => {
              const isSelected = diasAntecedencia === dias;
              return (
                <TouchableOpacity
                  key={dias}
                  style={[
                    styles.diaBtn,
                    isSelected && styles.diaBtnSelected,
                  ]}
                  onPress={() => handleSelectDias(dias)}
                  disabled={!alertasAtivos}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.diaBtnNum, isSelected && styles.diaBtnNumSelected]}>
                    {dias}
                  </Text>
                  <Text style={[styles.diaBtnLabel, isSelected && styles.diaBtnLabelSelected]}>
                    {dias === 1 ? 'dia' : 'dias'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ajuda */}
        <Text style={styles.groupLabel}>Ajuda</Text>
        <View style={[styles.card, Shadows.sm, { marginBottom: Spacing.sm }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleStartTutorial} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.primaryLight + '25' }]}>
              <MaterialCommunityIcons name="presentation-play" size={22} color={Colors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Tutorial do aplicativo</Text>
              <Text style={styles.settingDesc}>Abrir o guia explicativo de primeiro acesso</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.groupLabel}>Sobre o app</Text>
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.aboutRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.infoBg }]}>
              <MaterialCommunityIcons name="shield-check" size={22} color={Colors.info} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>SIGS</Text>
              <Text style={styles.settingDesc}>Gestão Sanitária Digital · v1.0.1</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: '#fff' },
  headerSubtitle: { ...Typography.body2, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
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
  bellBtnCritical: {
    backgroundColor: Colors.error,
    borderColor: 'transparent',
  },
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
  unseenBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },

  content: {
    padding: Spacing.md,
  },

  groupLabel: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    marginLeft: 2,
  },
  dimmed: { opacity: 0.45 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  cardDisabled: { opacity: 0.5 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingText: { flex: 1 },
  settingTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingDesc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  antecDesc: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },

  diasGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  diaBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
    gap: 2,
  },
  diaBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  diaBtnNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: -0.5,
  },
  diaBtnNumSelected: {
    color: Colors.primary,
  },
  diaBtnLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  diaBtnLabelSelected: {
    color: Colors.primary,
  },
});
