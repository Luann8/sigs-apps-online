import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLicencasStore } from '../store/licencasStore';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { getDaysUntilExpiry, formatDate } from '../utils/formatters';

export function AlertasScreen({ navigation }) {
  const { licencas } = useLicencasStore();

  const alertas = useMemo(() => {
    const list = [];
    
    licencas.forEach(l => {
      const days = getDaysUntilExpiry(l.dataVencimento);
      
      if (days < 0) {
        list.push({
          id: `vencida-${l.id}`,
          type: 'critical',
          title: 'Licença Vencida',
          subtitle: l.nome,
          date: l.dataVencimento,
          icon: 'alert-octagon',
          licencaId: l.id,
          description: `O documento expirou em ${formatDate(l.dataVencimento)}.`
        });
      } else if (days <= 30) {
        list.push({
          id: `vencendo-${l.id}`,
          type: 'warning',
          title: 'Vencimento Próximo',
          subtitle: l.nome,
          date: l.dataVencimento,
          icon: 'clock-alert-outline',
          licencaId: l.id,
          description: `Esta licença vence em ${days} dias.`
        });
      }

      // Alertas de inspeção pendente
      const temPendente = l.inspecoes.some(i => i.resultado === 'pendente');
      if (temPendente) {
        list.push({
          id: `pendente-${l.id}`,
          type: 'info',
          title: 'Inspeção Pendente',
          subtitle: l.nome,
          icon: 'clipboard-text-search-outline',
          licencaId: l.id,
          description: 'Existe uma inspeção aguardando conclusão.'
        });
      }
    });

    return list.sort((a, b) => {
      if (a.type === 'critical' && b.type !== 'critical') return -1;
      if (a.type !== 'critical' && b.type === 'critical') return 1;
      return 0;
    });
  }, [licencas]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>SIGS</Text>
              <Text style={styles.appTagline}>Gestão Sanitária Digital</Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerTitle}>Alertas</Text>
        <Text style={styles.headerSubtitle}>Notificações e pendências do sistema</Text>
      </LinearGradient>

      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => navigation.navigate('DetalheLicenca', { id: item.licencaId })}
          >
            <View style={[styles.iconBox, styles[`iconBox_${item.type}`]]}>
              <MaterialCommunityIcons 
                name={item.icon} 
                size={24} 
                color={item.type === 'critical' ? Colors.error : item.type === 'warning' ? Colors.warning : Colors.info} 
              />
            </View>
            <View style={styles.alertInfo}>
              <View style={styles.alertHeader}>
                <Text style={[styles.alertTitle, styles[`text_${item.type}`]]}>
                  {item.title}
                </Text>
                {item.date && (
                  <Text style={styles.alertDate}>{formatDate(item.date)}</Text>
                )}
              </View>
              <Text style={styles.alertSubtitle}>{item.subtitle}</Text>
              <Text style={styles.alertDesc}>{item.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textDisabled} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={Colors.textDisabled} />
            <Text style={styles.emptyTitle}>Tudo em ordem!</Text>
            <Text style={styles.emptySubtitle}>Não existem alertas ou pendências no momento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: { marginBottom: Spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  appName: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  appTagline: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  headerTitle: { ...Typography.h2, color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  
  listContent: { padding: Spacing.md, paddingBottom: 120 },
  
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconBox_critical: { backgroundColor: Colors.errorBg },
  iconBox_warning: { backgroundColor: Colors.warningBg },
  iconBox_info: { backgroundColor: Colors.infoBg },
  
  alertInfo: { flex: 1 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTitle: { ...Typography.h4, fontSize: 14 },
  text_critical: { color: Colors.error },
  text_warning: { color: Colors.warning },
  text_info: { color: Colors.info },
  
  alertDate: { ...Typography.caption, color: Colors.textSecondary },
  alertSubtitle: { ...Typography.body1, fontWeight: '700', color: Colors.textPrimary, marginVertical: 2 },
  alertDesc: { ...Typography.caption, color: Colors.textSecondary },
  
  empty: { alignItems: 'center', paddingTop: 100, gap: Spacing.sm, paddingHorizontal: 40 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});
