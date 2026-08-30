/**
 * licencaRisco.js
 *
 * Módulo central do sistema de risco real.
 * Cruza dois eixos independentes:
 *   1. Situação do documento (estado do ciclo de vida)
 *   2. Peso do tipo de documento (consequência legal, imutável)
 *
 * A cor final NÃO vem só da data de vencimento —
 * vem do cruzamento dos dois eixos.
 */

// ---------------------------------------------------------------------------
// Eixo 1 — Peso por tipo de documento (lista fixa, imutável)
// ---------------------------------------------------------------------------
// Campos:
//   peso      : 'alto' | 'medio' | 'baixo'
//   lei       : string — fundamento legal
//   presumido : true quando o artigo exato ainda não foi localizado
//               (o sistema exibe um aviso de "classificação presumida")
// ---------------------------------------------------------------------------
export const PESOS_LICENCA = {
  alvara_sanitario: {
    peso: 'alto',
    lei: 'Res. SES/RJ nº 1.822/2019, art. 1º',
    presumido: false,
  },
  alvara_funcionamento: {
    peso: 'alto',
    lei: 'LC Municipal nº 36/1997 — cassação por reincidência',
    presumido: false,
  },
  bombeiros: {
    peso: 'alto',
    lei: 'Dec. Estadual nº 42/2018 — regime sancionatório',
    presumido: true,
  },
  licenca_ambiental: {
    peso: 'alto',
    lei: 'Res. CONEMA nº 92/2021',
    presumido: true,
  },
  pgrss: {
    peso: 'alto',
    lei: 'RDC nº 222/2018, art. 5º, § 1º — exigência para emissão da licença sanitária',
    presumido: false,
  },
  desinsetizacao: {
    peso: 'alto',
    lei: 'RDC nº 222/2018, art. 6º — conteúdo obrigatório do PGRSS',
    presumido: false,
  },
  crmv: {
    peso: 'medio',
    lei: 'Res. CFMV nº 1.275/2019, art. 12 — multa e pena disciplinar',
    presumido: false,
  },
  termo_responsabilidade: {
    peso: 'medio',
    lei: 'Res. CFMV nº 1.275/2019, art. 12',
    presumido: false,
  },
  contrato_rss: {
    peso: 'medio',
    lei: 'RDC nº 222/2018, art. 6º, XI',
    presumido: false,
  },
  radioproteção: {
    peso: 'medio',
    lei: 'RDC nº 611/2022',
    presumido: true,
  },
  potabilidade_agua: {
    peso: 'baixo',
    lei: 'Nenhuma consequência legal prevista — boa prática recomendada',
    presumido: false,
  },
};

// ---------------------------------------------------------------------------
// Eixo 2 — Situação do documento (estados do ciclo de vida)
// ---------------------------------------------------------------------------
export const SITUACOES = {
  em_dia:                  { label: 'Em dia',                 group: 'ok'       },
  a_vencer:                { label: 'A vencer',               group: 'atencao'  },
  renovacao_protocolada:   { label: 'Renovação protocolada',  group: 'atencao'  },
  vencida:                 { label: 'Vencida',                group: 'critico'  },
  nunca_obtido:            { label: 'Nunca obtido',           group: 'critico'  },
  suspensa:                { label: 'Suspensa',               group: 'critico'  },
};

// Mapeamento de valores legados → nova situação
const LEGADO_MAP = {
  ativa:    'em_dia',
  pendente: 'a_vencer',
  vencida:  'vencida',
  suspensa: 'suspensa',
};

// ---------------------------------------------------------------------------
// Função principal: calcularRisco
// ---------------------------------------------------------------------------
/**
 * Recebe um documento de licença e retorna sua avaliação de risco.
 *
 * @param {object} licenca  — documento Convex da tabela licencas
 * @param {string} [now]    — data ISO para testar (default: hoje)
 * @returns {{
 *   situacaoEfetiva: string,
 *   situacaoLabel: string,
 *   peso: string,
 *   lei: string,
 *   presumido: boolean,
 *   cor: 'verde'|'amarelo'|'laranja'|'vermelho'|'cinza',
 *   corLabel: string,
 *   grupo: 'semRisco'|'atencao'|'critico'|'cinza',
 * }}
 */
export function calcularRisco(licenca, now) {
  const hoje = now ? new Date(now) : new Date();
  hoje.setHours(0, 0, 0, 0);

  // --- Situação efetiva ---
  // Prioridade:
  //   1. Campo `situacao` (novo, explícito)
  //   2. Mapeamento legado via `status`
  //   3. Inferência pela data de vencimento
  let situacaoEfetiva = licenca.situacao
    ?? LEGADO_MAP[licenca.status]
    ?? _inferirSituacaoPorData(licenca.dataVencimento, hoje);

  // Se já tem situação explícita mas é "em_dia" / "a_vencer" e a data
  // passou sem protocolo protocolado, degradamos para "vencida".
  if (
    situacaoEfetiva !== 'renovacao_protocolada' &&
    situacaoEfetiva !== 'nunca_obtido' &&
    situacaoEfetiva !== 'suspensa'
  ) {
    situacaoEfetiva = _inferirSituacaoPorData(licenca.dataVencimento, hoje);
  }

  // --- Peso ---
  const pesoConfig = PESOS_LICENCA[licenca.tipoLicenca] ?? {
    peso: 'medio',
    lei: 'Classificação não encontrada',
    presumido: true,
  };

  // --- Cor (matriz peso × situação) ---
  const cor = _matrizCor(situacaoEfetiva, pesoConfig.peso);

  return {
    situacaoEfetiva,
    situacaoLabel: SITUACOES[situacaoEfetiva]?.label ?? situacaoEfetiva,
    peso: pesoConfig.peso,
    lei: pesoConfig.lei,
    presumido: pesoConfig.presumido,
    cor,
    corLabel: _corLabel(cor),
    grupo: _grupoRisco(cor),
  };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function _inferirSituacaoPorData(dataVencimento, hoje) {
  if (!dataVencimento) return 'nunca_obtido';
  const venc = new Date(dataVencimento);
  const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return 'vencida';
  if (diff <= 30) return 'a_vencer';
  return 'em_dia';
}

/**
 * Matriz de cor conforme tabela definida pelo usuário.
 *
 * Peso baixo → sempre cinza (nunca alerta)
 * Em dia     → verde (exceto baixo)
 * A vencer / renovação protocolada → amarelo
 * Vencida / nunca obtido / suspensa + alto → vermelho
 * Vencida / nunca obtido / suspensa + médio → laranja
 */
function _matrizCor(situacao, peso) {
  if (peso === 'baixo') return 'cinza';

  const group = SITUACOES[situacao]?.group ?? 'critico';

  if (group === 'ok')      return 'verde';
  if (group === 'atencao') return 'amarelo';

  // group === 'critico'
  return peso === 'alto' ? 'vermelho' : 'laranja';
}

function _corLabel(cor) {
  const map = {
    verde:    'Sem risco',
    amarelo:  'Atenção',
    laranja:  'Irregular',
    vermelho: 'Crítico',
    cinza:    'Baixo risco',
  };
  return map[cor] ?? cor;
}

function _grupoRisco(cor) {
  if (cor === 'verde' || cor === 'cinza') return 'semRisco';
  if (cor === 'amarelo')                  return 'atencao';
  if (cor === 'laranja')                  return 'critico'; // conta como crítico para alertas
  return 'critico';
}

// ---------------------------------------------------------------------------
// Classes CSS Tailwind por cor (centraliza tokens visuais)
// ---------------------------------------------------------------------------
export const COR_CLASSES = {
  verde: {
    badge:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    icon:   'text-emerald-600 dark:text-emerald-400',
    bg:     'bg-emerald-50 dark:bg-emerald-950/60',
    dot:    'bg-emerald-500',
  },
  amarelo: {
    badge:  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/50',
    icon:   'text-amber-600 dark:text-amber-400',
    bg:     'bg-amber-50 dark:bg-amber-950/60',
    dot:    'bg-amber-500',
  },
  laranja: {
    badge:  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-900/50',
    icon:   'text-orange-600 dark:text-orange-400',
    bg:     'bg-orange-50 dark:bg-orange-950/60',
    dot:    'bg-orange-500',
  },
  vermelho: {
    badge:  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/50',
    icon:   'text-rose-600 dark:text-rose-400',
    bg:     'bg-rose-50 dark:bg-rose-950/60',
    dot:    'bg-rose-500',
  },
  cinza: {
    badge:  'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400',
    border: 'border-gray-200 dark:border-zinc-700',
    icon:   'text-gray-400 dark:text-zinc-500',
    bg:     'bg-gray-50 dark:bg-zinc-800/40',
    dot:    'bg-gray-400',
  },
};
