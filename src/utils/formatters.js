import { Colors } from '../theme/colors';

export const TIPOS_LICENCA = [
  { key: 'alvara_funcionamento',  label: 'Alvará de Localização e Funcionamento',                        icon: 'store-check-outline' },
  { key: 'alvara_sanitario',      label: 'Licença ou Alvará Sanitário',                                  icon: 'medical-bag' },
  { key: 'crmv',                  label: 'Registro da Pessoa Jurídica no CRMV',                          icon: 'paw' },
  { key: 'termo_responsabilidade',label: 'Termo de Responsabilidade Técnica',                            icon: 'file-sign' },
  { key: 'licenca_ambiental',     label: 'Licença Ambiental',                                            icon: 'leaf' },
  { key: 'pgrss',                 label: 'Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS)', icon: 'recycle' },
  { key: 'contrato_rss',          label: 'Contrato de Coleta de RSS',                                    icon: 'truck-outline' },
  { key: 'bombeiros',             label: 'Certificado de Licença do Bombeiros',                          icon: 'fire-extinguisher' },
  { key: 'potabilidade_agua',     label: 'Controle de Potabilidade da Água e Limpeza de Reservatório',   icon: 'water-check-outline' },
  { key: 'desinsetizacao',        label: 'Certificado de Desinsetização e Desratização',                 icon: 'bug-outline' },
  { key: 'radioproteção',         label: 'Plano de Radioproteção',                                       icon: 'radioactive' },
];

export function getTipoLicencaConfig(key) {
  const found = TIPOS_LICENCA.find((t) => t.key === key);
  return found || { key, label: key || 'Desconhecido', icon: 'file-document-outline' };
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function unmaskCNPJ(value) {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 14);
}

export function validarCNPJ(cnpj) {
  const digits = unmaskCNPJ(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[12], 10) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return parseInt(digits[13], 10) === digit2;
}

export function maskTelefone(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function unmaskTelefone(value) {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 11);
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
