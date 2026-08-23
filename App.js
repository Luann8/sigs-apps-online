import 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useQuery } from 'convex/react';
import { api } from './convex/_generated/api';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { LicencasScreen } from './src/screens/LicencasScreen';
import { DetalheLicencaScreen } from './src/screens/DetalheLicencaScreen';
import { CalendarioScreen } from './src/screens/CalendarioScreen';
import { CadastroScreen } from './src/screens/CadastroScreen';
import { EditarLicencaScreen } from './src/screens/EditarLicencaScreen';
import { ConfiguracoesScreen } from './src/screens/ConfiguracoesScreen';
import { AlertasScreen } from './src/screens/AlertasScreen';
import { EstabelecimentosScreen } from './src/screens/EstabelecimentosScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import Toast from 'react-native-toast-message';
import { Colors, Shadows } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ConvexClerkProvider } from './src/providers/ConvexClerkProvider';
import { useSettingsStore } from './src/store/settingsStore';
import { requestPermissionsAsync, reagendarTodasAsNotificacoes } from './src/utils/notifications';
import { getDaysUntilExpiry } from './src/utils/formatters';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CadastroTabButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.fabOuter}
      onPress={() => navigation.navigate('Cadastro')}
      activeOpacity={0.88}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TabIcon({ name, focused, size = 24 }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <MaterialCommunityIcons name={name} size={size} color={focused ? Colors.primary : Colors.tabBarInactive} />
    </View>
  );
}

import { Text, ScrollView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

function TabNavigator({ navigation }) {
  const insets = useSafeAreaInsets();
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];
  const [activeTab, setActiveTab] = React.useState(0);
  const scrollViewRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(Dimensions.get('window').width);

  const alertCount = useMemo(() => {
    return rawLicencas.filter((l) => {
      const d = getDaysUntilExpiry(l.dataVencimento);
      return d <= 7 || l.status === 'vencida';
    }).length;
  }, [rawLicencas]);

  const handleScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / containerWidth);
    if (pageIndex !== activeTab && pageIndex >= 0 && pageIndex < 4) {
      setActiveTab(pageIndex);
    }
  };

  const goToTab = (index) => {
    Haptics.selectionAsync();
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({ x: index * containerWidth, animated: true });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: Colors.background }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Horizontal Swipe Pager Container */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        <View style={{ width: containerWidth, flex: 1 }}>
          <DashboardScreen navigation={navigation} />
        </View>
        <View style={{ width: containerWidth, flex: 1 }}>
          <CalendarioScreen navigation={navigation} />
        </View>
        <View style={{ width: containerWidth, flex: 1 }}>
          <LicencasScreen navigation={navigation} />
        </View>
        <View style={{ width: containerWidth, flex: 1 }}>
          <ConfiguracoesScreen navigation={navigation} />
        </View>
      </ScrollView>

      {/* Custom Swipeable Bottom Tab Bar */}
      <View
        style={[
          styles.tabBarContainer,
          {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          },
        ]}
      >
        <TouchableOpacity style={styles.tabBtn} onPress={() => goToTab(0)} activeOpacity={0.7}>
          <TabIcon name={activeTab === 0 ? 'view-dashboard' : 'view-dashboard-outline'} focused={activeTab === 0} />
          <Text style={[styles.tabLabel, { color: activeTab === 0 ? Colors.primary : Colors.tabBarInactive }]}>
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => goToTab(1)} activeOpacity={0.7}>
          <TabIcon name={activeTab === 1 ? 'calendar-month' : 'calendar-month-outline'} focused={activeTab === 1} />
          <Text style={[styles.tabLabel, { color: activeTab === 1 ? Colors.primary : Colors.tabBarInactive }]}>
            Calendário
          </Text>
        </TouchableOpacity>

        <View style={styles.fabContainer}>
          <CadastroTabButton />
        </View>

        <TouchableOpacity style={styles.tabBtn} onPress={() => goToTab(2)} activeOpacity={0.7}>
          <TabIcon name={activeTab === 2 ? 'clipboard-text' : 'clipboard-text-outline'} focused={activeTab === 2} />
          <Text style={[styles.tabLabel, { color: activeTab === 2 ? Colors.primary : Colors.tabBarInactive }]}>
            Licenças
          </Text>
          {alertCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{alertCount > 9 ? '9+' : alertCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => goToTab(3)} activeOpacity={0.7}>
          <TabIcon name={activeTab === 3 ? 'cog' : 'cog-outline'} focused={activeTab === 3} />
          <Text style={[styles.tabLabel, { color: activeTab === 3 ? Colors.primary : Colors.tabBarInactive }]}>
            Opções
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const { Colors: ThemeColors, isDark } = useTheme();
  const hasSeenTutorial = useSettingsStore((state) => state.hasSeenTutorial);
  const rawLicencas = useQuery(api.licencas.listAll) ?? [];

  React.useEffect(() => {
    requestPermissionsAsync().then(() => {
      const licencas = rawLicencas.map((l) => ({ ...l, id: l._id }));
      reagendarTodasAsNotificacoes(licencas);
    });
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#1E1E1E' : '#FFFFFF');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, rawLicencas]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: ThemeColors.background }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'auto'} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={hasSeenTutorial ? 'Estabelecimentos' : 'Onboarding'}
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Estabelecimentos" component={EstabelecimentosScreen} />
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="DetalheLicenca" component={DetalheLicencaScreen} />
            <Stack.Screen name="EditarLicenca" component={EditarLicencaScreen} />
            <Stack.Screen name="Alertas" component={AlertasScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ConvexClerkProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ConvexClerkProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadows.md,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: Colors.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  tabIconWrap: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabIconWrapActive: {
    backgroundColor: Colors.primary + '14',
  },

  // FAB
  fabOuter: {
    position: 'absolute',
    top: -22,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    ...Shadows.lg,
    zIndex: 999,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.surface,
  },
});
