import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useLicencasStore } from '../store/licencasStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { formatDate, getDaysUntilExpiry, getStatusConfig } from '../utils/formatters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlertsStore } from '../store/alertsStore';
import { buildAlertList } from '../utils/alertsHelper';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

const today = new Date().toISOString().split('T')[0];

function getUrgencyColor(licenca) {
  const days = getDaysUntilExpiry(licenca.dataVencimento);
  if (days < 0) return Colors.error;
  if (days <= 7) return Colors.error;
  if (days <= 30) return Colors.warning;
  return Colors.success;
}

function getUrgencyLabel(days) {
  if (days < 0) return `Vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  if (days <= 30) return `Vence em ${days} dias`;
  return `${days} dias restantes`;
}

function getCalendarEventStyles(item) {
  const days = getDaysUntilExpiry(item.dataVencimento);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  if (isExpired) {
    return {
      bg: '#FFF5F5',
      accent: Colors.error,
      icon: 'alert-circle',
      iconColor: Colors.error,
    };
  }
  if (isExpiringSoon) {
    return {
      bg: '#FFF9F2',
      accent: Colors.warning,
      icon: 'clock-outline',
      iconColor: Colors.warning,
    };
  }
  if (item.tipo === 'veterinaria') {
    return {
      bg: '#F0FDF4',
      accent: Colors.primary,
      icon: 'paw',
      iconColor: Colors.primary,
    };
  } else {
    return {
      bg: '#F0F9FF',
      accent: Colors.secondary,
      icon: 'medical-bag',
      iconColor: Colors.secondary,
    };
  }
}

export function CalendarioScreen({ navigation }) {
  const licencas = useLicencasStore((s) => s.licencas);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.substring(0, 7));
  const insets = useSafeAreaInsets();

  const { countUnseen } = useAlertsStore();
  const alertas = buildAlertList(licencas);
  const unseenCount = countUnseen(alertas);
  const hasCritical = alertas.some((a) => a.type === 'expired');

  // Build marked dates: colored dots per urgency
  const markedDates = useMemo(() => {
    const marks = {};

    licencas.forEach((l) => {
      const d = l.dataVencimento;
      if (!d) return;
      if (!marks[d]) marks[d] = { dots: [] };

      const urgencyColor = getUrgencyColor(l);
      const alreadyHasColor = marks[d].dots.some((dot) => dot.color === urgencyColor);
      if (!alreadyHasColor) {
        marks[d].dots.push({ key: `${l.id}-${urgencyColor}`, color: urgencyColor });
      }
    });

    // Today marker
    if (!marks[today]) marks[today] = { dots: [] };
    marks[today].today = true;

    // Selected marker
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || { dots: [] }),
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: '#fff',
      };
    }

    return marks;
  }, [licencas, selectedDate]);

  // Count by urgency for the visible month
  const monthStats = useMemo(() => {
    const [year, month] = currentMonth.split('-');
    const monthLicencas = licencas.filter((l) => l.dataVencimento?.startsWith(`${year}-${month}`));
    return {
      expired: monthLicencas.filter((l) => getDaysUntilExpiry(l.dataVencimento) < 0).length,
      urgent: monthLicencas.filter((l) => {
        const d = getDaysUntilExpiry(l.dataVencimento);
        return d >= 0 && d <= 7;
      }).length,
      soon: monthLicencas.filter((l) => {
        const d = getDaysUntilExpiry(l.dataVencimento);
        return d > 7 && d <= 30;
      }).length,
      ok: monthLicencas.filter((l) => getDaysUntilExpiry(l.dataVencimento) > 30).length,
    };
  }, [licencas, currentMonth]);

  const licencasDoDia = useMemo(() => {
    if (!selectedDate) return [];
    return licencas.filter((l) => l.dataVencimento === selectedDate);
  }, [licencas, selectedDate]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dow = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return `${dow[date.getDay()]}, ${d} de ${months[Number(m) - 1]} de ${y}`;
  }, [selectedDate]);

  const isToday = selectedDate === today;

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
            <Text style={styles.headerTitle}>Calendário</Text>
            <Text style={styles.headerSubtitle}>Vencimentos do mês</Text>
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

        {/* Month stats */}
        <View style={styles.statsRow}>
          {monthStats.expired > 0 && (
            <StatChip count={monthStats.expired} label="Vencidas" color={Colors.error} />
          )}
          {monthStats.urgent > 0 && (
            <StatChip count={monthStats.urgent} label="Urgente" color={Colors.warning} />
          )}
          {monthStats.soon > 0 && (
            <StatChip count={monthStats.soon} label="Em breve" color={Colors.warningLight} />
          )}
          {monthStats.ok > 0 && (
            <StatChip count={monthStats.ok} label="Em dia" color={Colors.success} />
          )}
          {monthStats.expired === 0 && monthStats.urgent === 0 && monthStats.soon === 0 && monthStats.ok === 0 && (
            <StatChip count={0} label="Nenhum vencimento" color="rgba(255,255,255,0.5)" />
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={licencasDoDia}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <>
            {/* Calendar */}
            <View style={[styles.calendarCard, Shadows.md]}>
              <Calendar
                markingType="multi-dot"
                markedDates={markedDates}
                current={today}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                onMonthChange={(month) => setCurrentMonth(month.dateString.substring(0, 7))}
                enableSwipeMonths
                theme={{
                  backgroundColor: '#fff',
                  calendarBackground: '#fff',
                  textSectionTitleColor: Colors.textTertiary,
                  textSectionTitleDisabledColor: Colors.textDisabled,
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: '#fff',
                  todayTextColor: Colors.primary,
                  todayBackgroundColor: Colors.primaryLight + '22',
                  dayTextColor: Colors.textPrimary,
                  textDisabledColor: Colors.textDisabled,
                  dotColor: Colors.primary,
                  selectedDotColor: '#fff',
                  arrowColor: Colors.primary,
                  disabledArrowColor: Colors.textDisabled,
                  monthTextColor: Colors.textPrimary,
                  indicatorColor: Colors.primary,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
              />

              {/* Legend */}
              <View style={styles.legend}>
                <LegendItem color={Colors.error} label="Vencida / urgente" />
                <LegendItem color={Colors.warning} label="Vence em breve" />
                <LegendItem color={Colors.success} label="Em dia" />
              </View>
            </View>

            {/* Day header */}
            <View style={styles.dayHeader}>
              <View style={styles.dayLabelRow}>
                <MaterialCommunityIcons
                  name="calendar-today"
                  size={16}
                  color={isToday ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {isToday ? 'Hoje — ' : ''}{selectedDateLabel}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{licencasDoDia.length}</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const days = getDaysUntilExpiry(item.dataVencimento);
          const evStyle = getCalendarEventStyles(item);

          return (
            <TouchableOpacity
              style={[
                styles.googleEventCard,
                {
                  backgroundColor: evStyle.bg,
                  borderLeftColor: evStyle.accent,
                },
              ]}
              onPress={() => navigation.navigate('DetalheLicenca', { id: item.id })}
              activeOpacity={0.72}
            >
              <View style={styles.eventLeft}>
                <View style={styles.eventTimeWrap}>
                  <Text style={[styles.eventTime, { color: evStyle.accent }]}>Vence</Text>
                  <Text style={styles.eventDate}>
                    {item.dataVencimento ? item.dataVencimento.split('-')[2] : '—'}
                  </Text>
                </View>
                <View style={styles.eventDivider} />
              </View>

              <View style={styles.eventRight}>
                <View style={styles.eventHeaderRow}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <MaterialCommunityIcons name={evStyle.icon} size={18} color={evStyle.iconColor} />
                </View>
                <Text style={styles.eventSubtitle}>
                  {item.codigo} · {item.tipo === 'veterinaria' ? 'Veterinária' : 'Sanitária'}
                </Text>
                <Text style={[styles.eventUrgency, { color: evStyle.iconColor }]}>
                  {getUrgencyLabel(days)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          selectedDate ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons name="calendar-check-outline" size={40} color={Colors.textDisabled} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum vencimento</Text>
              <Text style={styles.emptySubtitle}>
                Não há licenças vencendo em {selectedDateLabel.toLowerCase()}.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function StatChip({ count, label, color }) {
  return (
    <View style={[statStyles.chip, { borderColor: color + '60' }]}>
      <Text style={[statStyles.count, { color }]}>{count}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }) {
  return (
    <View style={legendStyles.item}>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
});

const legendStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  headerTitle: {
    ...Typography.h2,
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: Spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },

  listContent: {
    paddingHorizontal: Spacing.md,
  },

  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    flexWrap: 'wrap',
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  dayLabel: {
    ...Typography.h4,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  dayLabelToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: 12,
  },

  googleEventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 5,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 65,
  },
  eventTimeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  eventDivider: {
    width: 1.5,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginLeft: Spacing.sm,
  },
  eventRight: {
    flex: 1,
    paddingLeft: Spacing.xs,
    gap: 2,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.xs,
  },
  eventSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  eventUrgency: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    lineHeight: 20,
  },
});
