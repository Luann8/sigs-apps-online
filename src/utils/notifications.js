// Safe stub for notifications without expo-notifications dependency

export async function requestPermissionsAsync() {
  return false;
}

export async function getNotificationPermissionStatus() {
  return 'undetermined';
}

export async function reagendarTodasAsNotificacoes(licencas) {
  return;
}

export async function agendarNotificacaoVencimento(licenca) {
  return;
}

export async function cancelarNotificacoesDaLicenca(licencaId) {
  return;
}
