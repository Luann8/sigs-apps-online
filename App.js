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
import { CadastroScreen } from './src/screens/CadastroScreen';
import { Colors, BorderRadius, Spacing } from './src/theme/colors';
import { useLicencasStore } from './src/store/licencasStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CadastroTabButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={() => navigation.navigate('Cadastro')}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.fabGradient}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          position: 'relative',
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDisabled,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Inicio: focused ? 'view-dashboard' : 'view-dashboard-outline',
            Licencas: focused ? 'clipboard-text' : 'clipboard-text-outline',
            Cadastro: 'plus',
          };
          const iconName = icons[route.name] ?? 'circle';

          if (route.name === 'Cadastro') return null;

          return (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={iconName} 
                size={route.name === 'Inicio' ? 28 : 26} 
                color={color} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
        tabBarButton: route.name === 'Cadastro'
          ? (props) => <CadastroTabButton {...props} />
          : undefined,
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Cadastro" component={CadastroScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Licencas" component={LicencasScreen} options={{ tabBarLabel: 'Licenças' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const loadLicencas = useLicencasStore((s) => s.loadLicencas);

  React.useEffect(() => {
    loadLicencas();
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
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  fabContainer: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -29,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});