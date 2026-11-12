/**
 * Utilitários para controle de acesso e filtragem de estabelecimentos/licenças
 * de acordo com o vínculo entre Usuários e Clínicas (Estabelecimentos).
 */

export function canAccessAll(user) {
  if (!user) return false;
  if (user.role === 'Administrador' || user.email === 'fiscal@sigs.gov.br') {
    return true;
  }
  return user.podeLerTodos === true;
}

export function filterEstabelecimentosForUser(estabelecimentos, user, liveUser) {
  if (!estabelecimentos || !Array.isArray(estabelecimentos)) return [];
  const currentUser = liveUser || user;
  if (!currentUser) return [];

  // Administrador ou usuário com permissão global vê todas
  if (canAccessAll(currentUser)) {
    return estabelecimentos;
  }

  const userEstIds = new Set(currentUser.estabelecimentosIds || []);
  const userId = String(currentUser.id || currentUser._id || '');

  return estabelecimentos.filter((est) => {
    if (!est) return false;
    // 1. Vinculado via usuário.estabelecimentosIds
    if (userEstIds.has(est._id)) return true;
    // 2. Vinculado via estabelecimento.usuariosIds
    if (Array.isArray(est.usuariosIds) && est.usuariosIds.includes(userId)) return true;
    return false;
  });
}

export function filterLicencasForUser(licencas, allowedEstabelecimentos, user, liveUser) {
  if (!licencas || !Array.isArray(licencas)) return [];
  const currentUser = liveUser || user;
  if (!currentUser) return [];

  if (canAccessAll(currentUser)) {
    return licencas;
  }

  const allowedEstIds = new Set((allowedEstabelecimentos || []).map((e) => e?._id).filter(Boolean));
  return licencas.filter((lic) => lic && allowedEstIds.has(lic.estabelecimentoId));
}

