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

export function CalendarioScreen({ navigation }) {
  const licencas = useLicencasStore((s) => s.licencas);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.substring(0, 7));
  const insets = useSafeAreaInsets();

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
        <Text style={styles.headerTitle}>Calendário</Text>
        <Text style={styles.headerSubtitle}>Vencimentos do mês</Text>

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
          const urgencyColor = getUrgencyColor(item);
          const statusConfig = getStatusConfig(item.status);

          return (
            <TouchableOpacity
              style={[styles.licencaCard, Shadows.sm, { borderLeftColor: urgencyColor }]}
              onPress={() => navigation.navigate('DetalheLicenca', { id: item.id })}
              activeOpacity={0.72}
            >
              <View style={styles.cardMain}>
                <View style={[styles.cardIcon, { backgroundColor: urgencyColor + '15' }]}>
                  <MaterialCommunityIcons
                    name={item.tipo === 'veterinaria' ? 'paw' : 'medical-bag'}
                    size={22}
                    color={urgencyColor}
                  />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
                  <Text style={styles.cardCodigo}>{item.codigo} · {item.tipo === 'veterinaria' ? 'Veterinária' : 'Sanitária'}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '18' }]}>
                      <MaterialCommunityIcons
                        name={days < 0 ? 'alert-circle' : 'clock-outline'}
                        size={11}
                        color={urgencyColor}
                      />
                      <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                        {getUrgencyLabel(days)}
                      </Text>
                    </View>
                  </View>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textDisabled} />
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

  licencaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardNome: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  cardCodigo: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  urgencyText: {
    ...Typography.caption,
    fontWeight: '700',
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
