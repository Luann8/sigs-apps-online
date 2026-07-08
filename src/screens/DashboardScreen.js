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
import { useAlertsStore } from '../store/alertsStore';
import { KpiCard } from '../components/KpiCard';
import { LicencaCard } from '../components/LicencaCard';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { getDaysUntilExpiry } from '../utils/formatters';
import { buildAlertList } from '../utils/alertsHelper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { OnboardingTour } from '../components/OnboardingTour';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return 'weather-sunny';
  if (h < 18) return 'weather-partly-cloudy';
  return 'weather-night';
}

export function DashboardScreen({ navigation }) {
  const { licencas } = useLicencasStore();
  const { countUnseen, isSeen } = useAlertsStore();
  const insets = useSafeAreaInsets();

  const { hasSeenTutorial, setHasSeenTutorial } = useSettingsStore();
  const [tourVisible, setTourVisible] = React.useState(false);

  React.useEffect(() => {
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setTourVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setTourVisible(false);
    }
  }, [hasSeenTutorial]);

  const handleCloseTour = () => {
    setTourVisible(false);
    setHasSeenTutorial(true);
  };

  const stats = useMemo(() => {
    const total    = licencas.length;
    const ativas   = licencas.filter((l) => l.status === 'ativa').length;
    const pendentes = licencas.filter((l) => l.status === 'pendente').length;
    const vencidas  = licencas.filter((l) => l.status === 'vencida').length;
    const suspensas = licencas.filter((l) => l.status === 'suspensa').length;
    const vencendo  = licencas.filter((l) => {
      const d = getDaysUntilExpiry(l.dataVencimento);
      return d <= 30 && d > 0 && l.status === 'ativa';
    }).length;
    const veterinarias = licencas.filter((l) => l.tipo === 'veterinaria').length;
    const sanitarias   = licencas.filter((l) => l.tipo === 'sanitaria').length;
    return { total, ativas, pendentes, vencidas, suspensas, vencendo, veterinarias, sanitarias };
  }, [licencas]);

  // Lista de alertas padronizada (mesmos IDs usados na AlertasScreen)
  const alertas = useMemo(() => buildAlertList(licencas), [licencas]);

  // Quantidade de alertas ainda não vistos pelo usuário
  const unseenCount = useMemo(() => countUnseen(alertas), [alertas, isSeen]);

  const hasCritical  = alertas.some((a) => a.type === 'critical' || a.type === 'urgent');
  const recentes     = licencas.slice(0, 4);

  // 3 alertas mais urgentes para exibir no card do dashboard
  const alertasPreview = alertas.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.greetRow}>
          <View>
            <View style={styles.greetLine}>
              <MaterialCommunityIcons
                name={getGreetingIcon()}
                size={16}
                color="rgba(255,255,255,0.75)"
              />
              <Text style={styles.greetText}>{getGreeting()}</Text>
            </View>
            <Text style={styles.headerTitle}>Painel</Text>
          </View>

          {/* Botão de notificações — sempre visível, muda de aparência */}
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
                  : alertas.length > 0
                  ? 'bell-badge-outline'
                  : 'bell-outline'
              }
              size={20}
              color="#fff"
            />
            {/* Badge de não lidos */}
            {unseenCount > 0 && (
              <View style={styles.unseenBadge}>
                <Text style={styles.unseenBadgeText}>
                  {unseenCount > 9 ? '9+' : unseenCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Summary strip */}
        <View style={styles.summaryStrip}>
          <SummaryItem value={stats.total}    label="Total"    color="#fff" />
          <View style={styles.stripDiv} />
          <SummaryItem value={stats.ativas}   label="Ativas"   color="#A5D6A7" />
          <View style={styles.stripDiv} />
          <SummaryItem value={stats.vencendo} label="Vencendo" color="#FFCC80" />
          <View style={styles.stripDiv} />
          <SummaryItem value={stats.vencidas} label="Vencidas" color="#EF9A9A" />
        </View>
      </LinearGradient>

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status das licenças</Text>
          <View style={styles.kpiGrid}>
            <KpiCard label="Ativas"    value={stats.ativas}   icon="check-circle-outline"  color={Colors.success}      bgColor={Colors.successBg}   />
            <KpiCard label="Pendentes" value={stats.pendentes} icon="clock-outline"          color={Colors.warning}      bgColor={Colors.warningBg}   />
            <KpiCard label="Vencidas"  value={stats.vencidas}  icon="alert-circle-outline"  color={Colors.error}        bgColor={Colors.errorBg}     />
            <KpiCard label="Suspensas" value={stats.suspensas} icon="minus-circle-outline"  color={Colors.textTertiary} bgColor={Colors.surfaceVariant} />
          </View>
        </View>

        {/* Por tipo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por tipo</Text>
          <View style={styles.typeRow}>
            <TypeCard icon="paw"           label="Veterinária" value={stats.veterinarias} color={Colors.veterinaria} bg={Colors.veterinariaBg} />
            <TypeCard icon="medical-bag"   label="Sanitária"   value={stats.sanitarias}   color={Colors.sanitaria}   bg={Colors.sanitariaBg}   />
            <TypeCard icon="calendar-alert" label="Vencendo"   value={stats.vencendo}     color={Colors.warning}     bg={Colors.warningBg}     />
          </View>
        </View>

        {/* Alertas ─ preview */}
        {alertas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Alertas</Text>
                {unseenCount > 0 && (
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{unseenCount} novo{unseenCount > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Alertas')}>
                <Text style={styles.seeAll}>
                  {alertas.length > 3 ? `Ver todos (${alertas.length})` : 'Ver todos'}
                </Text>
              </TouchableOpacity>
            </View>

            {alertasPreview.map((alerta) => {
              const cfg = PREVIEW_TYPE_CONFIG[alerta.type] || PREVIEW_TYPE_CONFIG.info;
              const isNew = !isSeen(alerta.id);
              return (
                <TouchableOpacity
                  key={alerta.id}
                  style={[
                    styles.alertCard,
                    { borderLeftColor: cfg.accentColor, backgroundColor: cfg.bg },
                    isNew && styles.alertCardNew,
                  ]}
                  onPress={() => navigation.navigate('DetalheLicenca', { id: alerta.licencaId })}
                  activeOpacity={0.75}
                >
                  {isNew && <View style={[styles.alertNewDot, { backgroundColor: cfg.accentColor }]} />}
                  <View style={[styles.alertIconBox, { backgroundColor: cfg.accentColor + '22' }]}>
                    <MaterialCommunityIcons name={alerta.icon} size={18} color={cfg.accentColor} />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertNome} numberOfLines={1}>{alerta.subtitle}</Text>
                    <Text style={[styles.alertMsg, { color: cfg.accentColor }]}>{alerta.description}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textDisabled} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recentes */}
        {recentes.length > 0 && (
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
                onPress={() => navigation.navigate('DetalheLicenca', { id: licenca.id })}
              />
            ))}
          </View>
        )}

        {licencas.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={56} color={Colors.textDisabled} />
            <Text style={styles.emptyTitle}>Nenhuma licença cadastrada</Text>
            <Text style={styles.emptySubtitle}>
              Cadastre a primeira licença usando o botão "+" na barra inferior.
            </Text>
          </View>
        )}
      </ScrollView>
      <OnboardingTour visible={tourVisible} onClose={handleCloseTour} />
    </View>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
function SummaryItem({ value, label, color }) {
  return (
    <View style={sumStyles.item}>
      <Text style={[sumStyles.value, { color }]}>{value}</Text>
      <Text style={sumStyles.label}>{label}</Text>
    </View>
  );
}

function TypeCard({ icon, label, value, color, bg }) {
  return (
    <View style={[typeStyles.card, Shadows.sm, { borderTopColor: color }]}>
      <View style={[typeStyles.iconWrap, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[typeStyles.value, { color }]}>{value}</Text>
      <Text style={typeStyles.label}>{label}</Text>
    </View>
  );
}

// Configs visuais para o preview de alertas no dashboard
const PREVIEW_TYPE_CONFIG = {
  critical: { accentColor: Colors.error,   bg: Colors.errorBg  },
  urgent:   { accentColor: Colors.error,   bg: '#FFF2EE'       },
  warning:  { accentColor: Colors.warning, bg: Colors.warningBg },
  info:     { accentColor: Colors.info,    bg: Colors.infoBg   },
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const sumStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
});

const typeStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  label: { ...Typography.label, color: Colors.textTertiary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  greetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  greetLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  greetText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  headerTitle: { ...Typography.h2, color: '#fff' },

  // Botão sino
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

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
  },
  stripDiv: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionBadge: {
    backgroundColor: Colors.warning + '22',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  sectionBadgeText: {
    ...Typography.label,
    color: Colors.warning,
    fontSize: 11,
  },
  seeAll: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Cards de alerta no dashboard
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderLeftWidth: 4,
  },
  alertCardNew: {
    // Leve highlight para alertas não vistos
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  alertNewDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  alertIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertContent: { flex: 1 },
  alertNome: {
    ...Typography.body2,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  alertMsg: {
    ...Typography.caption,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
