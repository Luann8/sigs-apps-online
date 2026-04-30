import { Colors } from '../theme/colors';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatCNPJ(cnpj) {
  return cnpj;
}

export function getDaysUntilExpiry(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(dateStr) {
  return getDaysUntilExpiry(dateStr) <= 30 && getDaysUntilExpiry(dateStr) > 0;
}

export function getStatusConfig(status) {
  const configs = {
    ativa: { label: 'Ativa', color: Colors.success, bg: Colors.successBg },
    pendente: { label: 'Pendente', color: Colors.warning, bg: Colors.warningBg },
    vencida: { label: 'Vencida', color: Colors.error, bg: Colors.errorBg },
    suspensa: { label: 'Suspensa', color: Colors.textSecondary, bg: '#EEEEEE' },
  };
  return configs[status] || configs.pendente;
}

export function getTipoConfig(tipo) {
  const configs = {
    veterinaria: { label: 'Veterinária', color: Colors.veterinaria, bg: Colors.veterinariaBg },
    sanitaria: { label: 'Sanitária', color: Colors.sanitaria, bg: Colors.sanitariaBg },
  };
  return configs[tipo] || configs.veterinaria;
}

export function getResultadoConfig(resultado) {
  const configs = {
    aprovado: { label: 'Aprovado', color: Colors.success, icon: 'check-circle' },
    reprovado: { label: 'Reprovado', color: Colors.error, icon: 'close-circle' },
    pendente: { label: 'Pendente', color: Colors.warning, icon: 'clock-outline' },
  };
  return configs[resultado] || configs.pendente;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateCodigo(current) {
  return `L${String(current).padStart(3, '0')}`;
}
