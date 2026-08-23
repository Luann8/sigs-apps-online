import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useSettingsStore } from '../store/settingsStore';
import { reagendarTodasAsNotificacoes } from '../utils/notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlertsStore } from '../store/alertsStore';
import { buildAlertList } from '../utils/alertsHelper';
import { exportarBackupJSON, compartilharBackup, importarBackupJSON } from '../utils/backupHelper';
import Toast from 'react-native-toast-message';

import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { EstablishmentPickerModal } from '../components/EstablishmentPickerModal';

const OPCOES_DIAS = [1, 3, 7, 15, 30];

export function ConfiguracoesScreen() {
  const { Colors: ThemeColors, isDark } = useTheme();
  const {
    alertasAtivos,
    diasAntecedencia,
    theme,
    setAlertasAtivos,
    setDiasAntecedencia,
    setHasSeenTutorial,
    setTheme,
  } = useSettingsStore();
  const { estabelecimentoAtual } = useEstabelecimentosStore();
  const [pickerVisible, setPickerVisible] = useState(false);
  const licencas = useQuery(api.licencas.listAll) ?? [];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const { countUnseen } = useAlertsStore();
  const alertas = buildAlertList(licencas);
  const unseenCount = countUnseen(alertas);
  const hasCritical = alertas.some((a) => a.type === 'expired');

  const handleStartTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenTutorial(false);
    navigation.navigate('Onboarding');
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

  const handleToggleTheme = (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(value ? 'dark' : 'light');
  };

  const handleExportarBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      const { filePath } = await exportarBackupJSON();
      await compartilharBackup(filePath);
      Toast.show({ type: 'success', text1: 'Backup exportado', text2: 'Arquivo compartilhado com sucesso' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro ao exportar', text2: e.message });
    } finally {
      setExporting(false);
    }
  };

  const handleImportarBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      setImporting(true);
      const fileUri = result.assets[0].uri;
      const summary = await importarBackupJSON(fileUri);
      Toast.show({
        type: 'success',
        text1: 'Backup importado',
        text2: `${summary.estabelecimentosImportados} estabelecimentos, ${summary.licencasImportadas} licenças`,
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro ao importar', text2: e.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: ThemeColors.background }]}>
      <LinearGradient
        colors={[ThemeColors.gradientStart, ThemeColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Estabelecimentos');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Configurações</Text>
            <Text style={styles.headerSubtitle}>Preferências do sistema</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.bellBtn,
              hasCritical && [styles.bellBtnCritical, { backgroundColor: ThemeColors.error }],
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
              <View style={[styles.unseenBadge, { backgroundColor: ThemeColors.warning, borderColor: ThemeColors.gradientEnd }]}>
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
        {/* Estabelecimentos */}
        <Text style={[styles.groupLabel, { color: ThemeColors.textTertiary }]}>Estabelecimento Ativo</Text>
        <View style={[styles.card, Shadows.sm, { backgroundColor: ThemeColors.surface, marginBottom: Spacing.md }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPickerVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: ThemeColors.primaryLight + '25' }]}>
              <MaterialCommunityIcons name="hospital-building" size={22} color={ThemeColors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: ThemeColors.textPrimary }]}>
                {estabelecimentoAtual ? estabelecimentoAtual.nome : 'Nenhum selecionado'}
              </Text>
              <Text style={[styles.settingDesc, { color: ThemeColors.textTertiary }]}>
                Toque para trocar o estabelecimento ativo
              </Text>
            </View>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={ThemeColors.primary} />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: ThemeColors.border, marginVertical: 8 }} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Estabelecimentos');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: ThemeColors.surfaceVariant }]}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={ThemeColors.textSecondary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: ThemeColors.textPrimary }]}>Gerenciar estabelecimentos</Text>
              <Text style={[styles.settingDesc, { color: ThemeColors.textTertiary }]}>Cadastrar, editar ou excluir empresas</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={ThemeColors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Notifications toggle */}
        <Text style={[styles.groupLabel, { color: ThemeColors.textTertiary }]}>Notificações</Text>
        <View style={[styles.card, Shadows.sm, { backgroundColor: ThemeColors.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: alertasAtivos ? ThemeColors.primaryLight + '30' : ThemeColors.surfaceVariant }]}>
              <MaterialCommunityIcons
                name={alertasAtivos ? 'bell-ring' : 'bell-off-outline'}
                size={22}
                color={alertasAtivos ? ThemeColors.primary : ThemeColors.textTertiary}
              />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: ThemeColors.textPrimary }]}>Alertas de vencimento</Text>
              <Text style={[styles.settingDesc, { color: ThemeColors.textTertiary }]}>
                {alertasAtivos ? 'Alertas ativados' : 'Alertas desativados'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: ThemeColors.border, true: ThemeColors.primaryLight }}
              thumbColor={alertasAtivos ? ThemeColors.primary : '#f4f3f4'}
              ios_backgroundColor={ThemeColors.border}
              onValueChange={handleToggleAlertas}
              value={alertasAtivos}
            />
          </View>
        </View>

        {/* Antecedência */}
        <Text style={[styles.groupLabel, { color: ThemeColors.textTertiary }, !alertasAtivos && styles.dimmed]}>
          Antecedência do alerta
        </Text>
        <View style={[styles.card, Shadows.sm, { backgroundColor: ThemeColors.surface }, !alertasAtivos && styles.cardDisabled]}>
          <Text style={[styles.antecDesc, { color: ThemeColors.textSecondary }, !alertasAtivos && styles.dimmed]}>
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
                    { borderColor: ThemeColors.border, backgroundColor: ThemeColors.surfaceVariant },
                    isSelected && [styles.diaBtnSelected, { borderColor: ThemeColors.primary, backgroundColor: ThemeColors.primary + '12' }],
                  ]}
                  onPress={() => handleSelectDias(dias)}
                  disabled={!alertasAtivos}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.diaBtnNum, { color: ThemeColors.textSecondary }, isSelected && [styles.diaBtnNumSelected, { color: ThemeColors.primary }]]}>
                    {dias}
                  </Text>
                  <Text style={[styles.diaBtnLabel, { color: ThemeColors.textTertiary }, isSelected && [styles.diaBtnLabelSelected, { color: ThemeColors.primary }]]}>
                    {dias === 1 ? 'dia' : 'dias'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ajuda */}
        <Text style={[styles.groupLabel, { color: ThemeColors.textTertiary }]}>Ajuda</Text>
        <View style={[styles.card, Shadows.sm, { backgroundColor: ThemeColors.surface, marginBottom: Spacing.sm }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleStartTutorial} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: ThemeColors.primaryLight + '25' }]}>
              <MaterialCommunityIcons name="presentation-play" size={22} color={ThemeColors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: ThemeColors.textPrimary }]}>Tutorial do aplicativo</Text>
              <Text style={[styles.settingDesc, { color: ThemeColors.textTertiary }]}>Abrir o guia explicativo de primeiro acesso</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={ThemeColors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.groupLabel, { color: ThemeColors.textTertiary }]}>Sobre o app</Text>
        <View style={[styles.card, Shadows.sm, { backgroundColor: ThemeColors.surface }]}>
          <View style={styles.aboutRow}>
            <View style={[styles.settingIcon, { backgroundColor: ThemeColors.infoBg }]}>
              <MaterialCommunityIcons name="shield-check" size={22} color={ThemeColors.info} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: ThemeColors.textPrimary }]}>SIGS</Text>
              <Text style={[styles.settingDesc, { color: ThemeColors.textTertiary }]}>Gestão Sanitária Digital · v1.0.1</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <EstablishmentPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onNavigateToManage={() => navigation.navigate('Estabelecimentos')}
      />
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
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
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
