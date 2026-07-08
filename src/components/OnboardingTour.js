import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme/colors';

const TOUR_STEPS = [
  {
    key: 'welcome',
    title: 'Bem-vindo ao SIGS! 👋',
    description: 'O SIGS ajuda você a controlar todas as licenças sanitárias e veterinárias do seu negócio. Nunca mais perca um prazo ou gere multas por licença vencida.',
  },
  {
    key: 'bell',
    title: 'Alertas de Vencimento 🔔',
    description: 'Este ícone acende quando há licenças prestes a vencer ou já vencidas. Toque nele para ver os detalhes e agir antes que seja tarde.',
  },
  {
    key: 'kpis',
    title: 'Situação das Licenças 📊',
    description: 'Veja aqui um resumo rápido: quantas licenças estão ativas ✅, pendentes ⏳, vencidas ❌ ou suspensas. Ideal para saber a saúde do negócio de relance.',
  },
  {
    key: 'types',
    title: 'Por Categoria 🏷️',
    description: 'Separa as licenças por tipo — Veterinária 🐾 ou Sanitária 🏥 — e mostra quais estão vencendo. Útil para diferentes departamentos ou tipos de negócio.',
  },
  {
    key: 'cost',
    title: 'Controle de Custos 💰',
    description: 'Ao cadastrar uma licença, você pode registrar o valor pago. Isso ajuda a planejar renovações e controlar os gastos com regularização do negócio.',
  },
  {
    key: 'add',
    title: 'Adicionar Licença ➕',
    description: 'Toque neste botão para cadastrar uma nova licença rapidamente. Preencha os dados do estabelecimento, o custo, a data de vencimento e pronto!',
  },
];

export function OnboardingTour({ visible, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  if (!visible) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Renderizar o holofote (spotlight) ao redor do elemento correspondente
  const renderHighlight = () => {
    const padding = 6;

    switch (step.key) {
      case 'bell': {
        // Sino de notificações no cabeçalho
        const bellSize = 42;
        const top = insets.top + 16;
        const right = Spacing.md;
        return (
          <>
            {/* Máscara ao redor do sino */}
            <View style={[styles.mask, { top: 0, left: 0, right: 0, height: top - padding }]} />
            <View style={[styles.mask, { top: top - padding, left: 0, width: screenWidth - bellSize - right - padding, height: bellSize + padding * 2 }]} />
            <View style={[styles.mask, { top: top - padding, left: screenWidth - right + padding, right: 0, height: bellSize + padding * 2 }]} />
            <View style={[styles.mask, { top: top + bellSize + padding, left: 0, right: 0, bottom: 0 }]} />

            {/* Réplica visual do Sino para destacar */}
            <View style={[styles.highlightContainer, { top: top - 2, right: right - 2 }]}>
              <View style={styles.bellBtnReplica}>
                <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
              </View>
            </View>
          </>
        );
      }

      case 'kpis': {
        // Grid de KPIs — header visível, sino precisa aparecer
        const headerHeight = insets.top + 110;
        const gridTop = insets.top + 145;
        const gridHeight = 168;
        const bellTop = insets.top + 16;
        const bellRight = Spacing.md;
        return (
          <>
            {/* Máscara ao redor do grid de KPIs */}
            <View style={[styles.mask, { top: 0, left: 0, right: 0, height: gridTop - padding }]} />
            <View style={[styles.mask, { top: gridTop - padding, left: 0, width: Spacing.md - padding, height: gridHeight + padding * 2 }]} />
            <View style={[styles.mask, { top: gridTop - padding, left: screenWidth - Spacing.md + padding, right: 0, height: gridHeight + padding * 2 }]} />
            <View style={[styles.mask, { top: gridTop + gridHeight + padding, left: 0, right: 0, bottom: 0 }]} />

            {/* Réplica do sino no header exposto */}
            <View style={[styles.highlightContainer, { top: bellTop, right: bellRight }]}>
              <View style={styles.bellBtnReplica}>
                <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
              </View>
            </View>

            {/* Caixa de destaque brilhante */}
            <View
              style={[
                styles.glowBorder,
                {
                  top: gridTop - padding,
                  left: Spacing.md - padding,
                  width: screenWidth - Spacing.md * 2 + padding * 2,
                  height: gridHeight + padding * 2,
                },
              ]}
            />
          </>
        );
      }

      case 'types': {
        // Grid de tipos — header visível, sino precisa aparecer
        const typesTop = insets.top + 338;
        const typesHeight = 115;
        const bellTop = insets.top + 16;
        const bellRight = Spacing.md;
        return (
          <>
            {/* Máscara ao redor */}
            <View style={[styles.mask, { top: 0, left: 0, right: 0, height: typesTop - padding }]} />
            <View style={[styles.mask, { top: typesTop - padding, left: 0, width: Spacing.md - padding, height: typesHeight + padding * 2 }]} />
            <View style={[styles.mask, { top: typesTop - padding, left: screenWidth - Spacing.md + padding, right: 0, height: typesHeight + padding * 2 }]} />
            <View style={[styles.mask, { top: typesTop + typesHeight + padding, left: 0, right: 0, bottom: 0 }]} />

            {/* Réplica do sino no header exposto */}
            <View style={[styles.highlightContainer, { top: bellTop, right: bellRight }]}>
              <View style={styles.bellBtnReplica}>
                <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
              </View>
            </View>

            {/* Caixa de destaque brilhante */}
            <View
              style={[
                styles.glowBorder,
                {
                  top: typesTop - padding,
                  left: Spacing.md - padding,
                  width: screenWidth - Spacing.md * 2 + padding * 2,
                  height: typesHeight + padding * 2,
                },
              ]}
            />
          </>
        );
      }

      case 'add': {
        // Botão central "+" da barra inferior
        const fabSize = 56;
        const bottom = Platform.OS === 'ios' ? insets.bottom + 2 : 8;
        const fabBottomY = screenHeight - bottom - fabSize;
        const fabLeftX = screenWidth / 2 - fabSize / 2;
        return (
          <>
            {/* Máscara ao redor do FAB */}
            <View style={[styles.mask, { top: 0, left: 0, right: 0, height: fabBottomY - padding }]} />
            <View style={[styles.mask, { top: fabBottomY - padding, left: 0, width: fabLeftX - padding, height: fabSize + padding * 2 }]} />
            <View style={[styles.mask, { top: fabBottomY - padding, left: fabLeftX + fabSize + padding, right: 0, height: fabSize + padding * 2 }]} />
            <View style={[styles.mask, { top: fabBottomY + fabSize + padding, left: 0, right: 0, bottom: 0 }]} />

            {/* Réplica do FAB */}
            <View style={[styles.highlightContainer, { bottom: bottom - 2, left: '50%', marginLeft: -28 - 2 }]}>
              <View style={styles.fabOuterReplica}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fabGradientReplica}
                >
                  <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                </LinearGradient>
              </View>
            </View>
          </>
        );
      }

      case 'cost':
        // Etapa conceitual de custo: tela toda escurecida
        return <View style={[StyleSheet.absoluteFill, styles.mask]} />;

      default:
        // Caso 'welcome' ou geral: escurece a tela toda (inclui o header)
        return <View style={[StyleSheet.absoluteFill, styles.mask]} />;
    }
  };

  // Posicionamento inteligente do Tooltip
  const getTooltipStyle = () => {
    const tooltipWidth = Math.min(330, screenWidth - 32);
    const left = (screenWidth - tooltipWidth) / 2;

    switch (step.key) {
      case 'bell':
        return {
          top: insets.top + 70,
          left,
          width: tooltipWidth,
        };
      case 'kpis':
        return {
          top: insets.top + 325,
          left,
          width: tooltipWidth,
        };
      case 'types':
        return {
          top: insets.top + 215, // Mostra acima dos tipos para não encavalar
          left,
          width: tooltipWidth,
        };
      case 'add':
        return {
          bottom: (Platform.OS === 'ios' ? insets.bottom : 0) + 80,
          left,
          width: tooltipWidth,
        };
      case 'cost':
        // Centralizado — etapa conceitual
        return {
          top: (screenHeight - 260) / 2,
          left,
          width: tooltipWidth,
        };
      default:
        // Centrado para a tela de boas-vindas
        return {
          top: (screenHeight - 220) / 2,
          left,
          width: tooltipWidth,
        };
    }
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="box-none">
        {renderHighlight()}

        {/* Balão explicativo */}
        <View style={[styles.tooltipCard, getTooltipStyle(), Shadows.lg]}>
          <View style={styles.tooltipHeader}>
            <Text style={styles.tooltipTitle}>{step.title}</Text>
            <Text style={styles.stepBadge}>
              {currentStep + 1}/{TOUR_STEPS.length}
            </Text>
          </View>

          <Text style={styles.tooltipDesc}>{step.description}</Text>

          <View style={styles.tooltipFooter}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>{isLast ? 'Fechar' : 'Pular'}</Text>
            </TouchableOpacity>

            <View style={styles.navRow}>
              {!isFirst && (
                <TouchableOpacity style={styles.backBtn} onPress={handlePrev} activeOpacity={0.7}>
                  <Text style={styles.backBtnText}>Voltar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.7}>
                <Text style={styles.nextBtnText}>
                  {isLast ? 'Entendi!' : 'Avançar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 36, 56, 0.78)',
  },
  glowBorder: {
    position: 'absolute',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  highlightContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  bellBtnReplica: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabOuterReplica: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  fabGradientReplica: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8EDF5', // Colors.divider
    zIndex: 10000,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2438', // Colors.textPrimary
    flex: 1,
    marginRight: Spacing.sm,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A96AE', // Colors.textTertiary
    backgroundColor: '#EEF2F8', // Colors.surfaceVariant
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  tooltipDesc: {
    fontSize: 14,
    color: '#4A6480', // Colors.textSecondary
    lineHeight: 20,
    marginBottom: Spacing.md + 4,
  },
  tooltipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: '#7A96AE', // Colors.textTertiary
    fontWeight: '600',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#EEF2F8',
  },
  backBtnText: {
    fontSize: 14,
    color: '#4A6480',
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#00796B', // Colors.primary
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm,
  },
  nextBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
