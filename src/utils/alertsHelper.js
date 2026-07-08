import { getDaysUntilExpiry, formatDate } from './formatters';

/**
 * Gera a lista padronizada de alertas a partir das licenças.
 * Usada tanto no Dashboard quanto na AlertasScreen, garantindo
 * que os IDs sejam idênticos para o controle de "visto/não visto".
 */
export function buildAlertList(licencas) {
  const list = [];

  licencas.forEach((l) => {
    const days = getDaysUntilExpiry(l.dataVencimento);

    if (days < 0 || l.status === 'vencida') {
      list.push({
        id: `vencida-${l.id}`,
        type: 'critical',
        title: 'Licença vencida',
        subtitle: l.nome,
        date: l.dataVencimento,
        icon: 'alert-octagon',
        licencaId: l.id,
        description: `Expirou em ${formatDate(l.dataVencimento)}.`,
      });
    } else if (days <= 7) {
      list.push({
        id: `urgente-${l.id}`,
        type: 'urgent',
        title: 'Vencimento urgente',
        subtitle: l.nome,
        date: l.dataVencimento,
        icon: 'clock-alert',
        licencaId: l.id,
        description: `Vence em ${days} dia${days !== 1 ? 's' : ''}.`,
      });
    } else if (days <= 30) {
      list.push({
        id: `vencendo-${l.id}`,
        type: 'warning',
        title: 'Vencimento próximo',
        subtitle: l.nome,
        date: l.dataVencimento,
        icon: 'clock-outline',
        licencaId: l.id,
        description: `Vence em ${days} dias.`,
      });
    }

    const temPendente = l.inspecoes?.some((i) => i.resultado === 'pendente');
    if (temPendente) {
      list.push({
        id: `pendente-${l.id}`,
        type: 'info',
        title: 'Inspeção pendente',
        subtitle: l.nome,
        icon: 'clipboard-text-search-outline',
        licencaId: l.id,
        description: 'Existe uma inspeção aguardando conclusão.',
      });
    }
  });

  const order = { critical: 0, urgent: 1, warning: 2, info: 3 };
  return list.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
}
