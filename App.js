import 'react-native-gesture-handler';
import React from 'react';
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

import { DashboardScreen } from './src/screens/DashboardScreen';
import { LicencasScreen } from './src/screens/LicencasScreen';
import { DetalheLicencaScreen } from './src/screens/DetalheLicencaScreen';
import { CalendarioScreen } from './src/screens/CalendarioScreen';
import { CadastroScreen } from './src/screens/CadastroScreen';
import { EditarLicencaScreen } from './src/screens/EditarLicencaScreen';
import { ConfiguracoesScreen } from './src/screens/ConfiguracoesScreen';
import { AlertasScreen } from './src/screens/AlertasScreen';
import Toast from 'react-native-toast-message';
import { Colors, Shadows } from './src/theme/colors';
import { useLicencasStore } from './src/store/licencasStore';
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

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const licencas = useLicencasStore((s) => s.licencas);

  const alertCount = licencas.filter((l) => { 
    const d = getDaysUntilExpiry(l.dataVencimento);
    return d <= 7 || l.status === 'vencida';
  }).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          ...Shadows.md,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icons = {
            Inicio: focused ? 'view-dashboard' : 'view-dashboard-outline',
            Licencas: focused ? 'clipboard-text' : 'clipboard-text-outline',
            Calendario: focused ? 'calendar-month' : 'calendar-month-outline',
            Configuracoes: focused ? 'cog' : 'cog-outline',
          };
          return <TabIcon name={icons[route.name] ?? 'circle'} focused={focused} />;
        },
        tabBarButton: route.name === 'Cadastro' ? (props) => <CadastroTabButton {...props} /> : undefined,
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarBadge: alertCount > 0 ? alertCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{ tabBarLabel: 'Calendário' }}
      />
      <Tab.Screen
        name="Cadastro"
        component={CadastroScreen}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Licencas"
        component={LicencasScreen}
        options={{ tabBarLabel: 'Licenças' }}
      />
      <Tab.Screen
        name="Configuracoes"
        component={ConfiguracoesScreen}
        options={{ tabBarLabel: 'Opções' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const loadLicencas = useLicencasStore((s) => s.loadLicencas);

  React.useEffect(() => {
    loadLicencas();
    requestPermissionsAsync().then(() => {
      const licencas = useLicencasStore.getState().licencas;
      reagendarTodasAsNotificacoes(licencas);
    });
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#FFFFFF');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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

const styles = StyleSheet.create({
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
