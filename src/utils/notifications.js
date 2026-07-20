import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

// ─── Canal Android ────────────────────────────────────────────────────────────
const CHANNEL_ID = 'sigs-vencimentos';

// Handler para notificações recebidas com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,   // atualiza badge do ícone do app
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permissões ───────────────────────────────────────────────────────────────
export async function requestPermissionsAsync() {
  if (Platform.OS === 'android') {
    // Canal dedicado com prioridade máxima e vibração
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Vencimentos de Licenças',
      description: 'Avisos sobre licenças próximas do vencimento ou vencidas.',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#00796B',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[SIGS] Permissão para notificações negada.');
    return false;
  }

  return true;
}

// ─── Reagendar tudo ───────────────────────────────────────────────────────────
export async function reagendarTodasAsNotificacoes(licencas) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { alertasAtivos } = useSettingsStore.getState();
  if (!alertasAtivos) return;

  for (const licenca of licencas) {
    if (licenca.status !== 'vencida') {
      await agendarNotificacaoVencimento(licenca);
    }
  }
}

// ─── Agendar para uma licença ─────────────────────────────────────────────────
export async function agendarNotificacaoVencimento(licenca) {
  const { alertasAtivos, diasAntecedencia } = useSettingsStore.getState();
  if (!alertasAtivos || !licenca?.dataVencimento) return;

  const dataVenc = new Date(licenca.dataVencimento + 'T09:00:00');
  const now = new Date();

  // ── N dias antes ──────────────────────────────────────────────────────────
  const triggerN = new Date(dataVenc);
  triggerN.setDate(triggerN.getDate() - diasAntecedencia);

  if (triggerN > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Licença próxima do vencimento',
        body: `"${licenca.tipoLicenca || licenca.nome || 'Licença'}" vence em ${diasAntecedencia} dia${diasAntecedencia !== 1 ? 's' : ''}.`,
        data: { licencaId: licenca.id, screen: 'DetalheLicenca' },
        sound: 'default',
        // Android: cor da notificação e ícone pequeno
        color: '#E65100',
        priority: 'high',
        sticky: false,
      },
      trigger: {
        type: 'date',
        date: triggerN,
        channelId: CHANNEL_ID,
      },
    });
  }

  // ── 1 dia antes (só se a config não for já 1 dia) ─────────────────────────
  if (diasAntecedencia !== 1) {
    const trigger1 = new Date(dataVenc);
    trigger1.setDate(trigger1.getDate() - 1);

    if (trigger1 > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Licença vence amanhã',
          body: `"${licenca.tipoLicenca || licenca.nome || 'Licença'}" vence amanhã. Renove antes que seja tarde.`,
          data: { licencaId: licenca.id, screen: 'DetalheLicenca' },
          sound: 'default',
          color: '#C62828',
          priority: 'max',
          sticky: false,
        },
        trigger: {
          type: 'date',
          date: trigger1,
          channelId: CHANNEL_ID,
        },
      });
    }
  }

  // ── No dia do vencimento ──────────────────────────────────────────────────
  if (dataVenc > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔴 Licença vence hoje',
        body: `"${licenca.tipoLicenca || licenca.nome || 'Licença'}" vence hoje. Acesse o SIGS para renovar.`,
        data: { licencaId: licenca.id, screen: 'DetalheLicenca' },
        sound: 'default',
        color: '#C62828',
        priority: 'max',
        sticky: false,
      },
      trigger: {
        type: 'date',
        date: dataVenc,
        channelId: CHANNEL_ID,
      },
    });
  }
}

// ─── Utilitário: cancela notificações de uma licença específica ───────────────
// (útil ao excluir ou renovar uma licença)
export async function cancelarNotificacoesDaLicenca(licencaId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.licencaId === licencaId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
