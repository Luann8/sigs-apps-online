import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme/ThemeContext';
import { Shadows } from '../theme/colors';

const SLIDES = [
  {
    id: '1',
    badge: 'BEM-VINDO AO SIGS',
    title: 'Gestão Sanitária e Veterinária Inteligente',
    description:
      'Simplifique o controle de licenças, alvarás e vistorias técnicas do seu estabelecimento em uma plataforma centralizada e segura.',
    icon: 'shield-check-outline',
    gradient: ['#00796B', '#004D40'],
    cardIcon: 'file-certificate-outline',
    highlights: ['Segurança jurídica', 'Armazenamento offline', 'Painel analítico'],
  },
  {
    id: '2',
    badge: 'ESTABELECIMENTOS & LICENÇAS',
    title: 'Organização Completa Sem Complicação',
    description:
      'Cadastre filiais ou múltiplos estabelecimentos, vincule CNPJ, acompanhe o responsável técnico e fotografe licenças físicas.',
    icon: 'store-cog-outline',
    gradient: ['#0288D1', '#01579B'],
    cardIcon: 'camera-document',
    highlights: ['Leitura de fotos', 'Filtros avançados', 'Suporte a CNPJ'],
  },
  {
    id: '3',
    badge: 'ALERTAS PREDITIVOS & CALENDÁRIO',
    title: 'Zero Licenças Vencidas no Seu Negócio',
    description:
      'Receba lembretes automáticos com antecedência personalizada e acompanhe os prazos exatos em nosso calendário visual.',
    icon: 'bell-ring-outline',
    gradient: ['#6A1B9A', '#4A148C'],
    cardIcon: 'calendar-clock-outline',
    highlights: ['Alarmes nativos', 'Visual em calendário', 'Histórico de auditorias'],
  },
  {
    id: '4',
    badge: 'PRONTO PARA COMEÇAR',
    title: 'Sua Gestão em Outro Nível A Partir de Hoje',
    description:
      'Tudo configurado! Acesse o aplicativo e mantenha o seu estabelecimento sempre em dia de forma prática.',
    icon: 'rocket-launch-outline',
    gradient: ['#2E7D32', '#1B5E20'],
    cardIcon: 'check-decagram-outline',
    highlights: ['Acesso rápido', 'Backup seguro', 'Relatórios rápidos'],
  },
];

export function OnboardingScreen() {
  const { Colors: ThemeColors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const setHasSeenTutorial = useSettingsStore((state) => state.setHasSeenTutorial);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasSeenTutorial(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs' }],
    });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleFinish();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }) => {
    return (
      <View style={[styles.slideContainer, { width }]}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={item.icon} size={64} color="#FFFFFF" />
          </View>

          <View style={styles.cardIllustration}>
            <MaterialCommunityIcons name={item.cardIcon} size={32} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>

        <View style={styles.textContent}>
          <Text style={[styles.title, { color: ThemeColors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.description, { color: ThemeColors.textSecondary }]}>
            {item.description}
          </Text>

          <View style={styles.highlightsContainer}>
            {item.highlights.map((text, idx) => (
              <View
                key={idx}
                style={[
                  styles.chip,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,121,107,0.08)' },
                ]}
              >
                <MaterialCommunityIcons name="check-circle" size={14} color={ThemeColors.primary} />
                <Text style={[styles.chipText, { color: ThemeColors.primary }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ThemeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header com botão Pular */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="shield-outline" size={22} color={ThemeColors.primary} />
          <Text style={[styles.headerAppTitle, { color: ThemeColors.textPrimary }]}>SIGS</Text>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: ThemeColors.textSecondary }]}>Pular</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Carrossel em FlatList */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      {/* Footer com Paginação e Botão Principal */}
      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: ThemeColors.primary }]
                    : [styles.inactiveDot, { backgroundColor: isDark ? '#444' : '#DDD' }],
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.actionButtonOuter}
          onPress={handleNext}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isLastSlide ? ['#00796B', '#004D40'] : [ThemeColors.primary, ThemeColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionButtonText}>
              {isLastSlide ? 'Começar Agora' : 'Próximo'}
            </Text>
            <MaterialCommunityIcons
              name={isLastSlide ? 'rocket-launch' : 'arrow-right'}
              size={22}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerAppTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  heroCard: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
    ...Shadows.md,
  },
  badgeWrap: {
    position: 'absolute',
    top: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIllustration: {
    position: 'absolute',
    bottom: 16,
    right: 20,
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
  },
  actionButtonOuter: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
