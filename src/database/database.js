import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sigs.db');

export const initDatabase = () => {

  db.execSync(`
    CREATE TABLE IF NOT EXISTS estabelecimentos (
      id TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      endereco TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      responsavel TEXT NOT NULL,
      crmv TEXT,
      tipo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS licencas (
      id TEXT PRIMARY KEY NOT NULL,
      codigo TEXT NOT NULL,
      tipoLicenca TEXT NOT NULL,
      estabelecimentoId TEXT NOT NULL,
      status TEXT NOT NULL,
      dataEmissao TEXT NOT NULL,
      dataVencimento TEXT NOT NULL,
      anexoUri TEXT,
      custo REAL,
      FOREIGN KEY (estabelecimentoId) REFERENCES estabelecimentos (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inspecoes (
      id TEXT PRIMARY KEY NOT NULL,
      licencaId TEXT NOT NULL,
      data TEXT NOT NULL,
      resultado TEXT NOT NULL,
      observacoes TEXT,
      fiscal TEXT NOT NULL,
      FOREIGN KEY (licencaId) REFERENCES licencas (id) ON DELETE CASCADE
    );
  `);

  // Migrations for existing databases
  const legacyColumns = ['nome','cnpj','endereco','telefone','email','responsavel','crmv','tipo','tipoLicenca','estabelecimentoId'];
  legacyColumns.forEach(col => {
    try { db.execSync(`ALTER TABLE licencas ADD COLUMN ${col} TEXT;`); } catch (e) { /* already exists */ }
  });

  try { db.execSync('ALTER TABLE licencas ADD COLUMN custo REAL;'); } catch (e) { /* already exists */ }
  try { db.execSync('ALTER TABLE licencas ADD COLUMN anexoUri TEXT;'); } catch (e) { /* already exists */ }
};

export const DatabaseService = {

  // ── Estabelecimentos ────────────────────────────────────────────────────────
  getEstabelecimentos: () => {
    return db.getAllSync('SELECT * FROM estabelecimentos ORDER BY nome ASC');
  },

  addEstabelecimento: (est) => {
    db.runSync(
      `INSERT INTO estabelecimentos (id, nome, cnpj, endereco, telefone, email, responsavel, crmv, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [est.id, est.nome, est.cnpj, est.endereco,
       est.telefone || null, est.email || null,
       est.responsavel, est.crmv || null, est.tipo]
    );
  },

  updateEstabelecimento: (id, updates) => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    db.runSync(`UPDATE estabelecimentos SET ${setClause} WHERE id = ?`, [...values, id]);
  },

  deleteEstabelecimento: (id) => {
    db.runSync('DELETE FROM estabelecimentos WHERE id = ?', [id]);
  },

  // ── Licenças ────────────────────────────────────────────────────────────────
  getLicencas: (estabelecimentoId) => {
    const rows = db.getAllSync(
      'SELECT * FROM licencas WHERE estabelecimentoId = ? ORDER BY dataVencimento ASC',
      [estabelecimentoId]
    );
    return rows.map(row => {
      const inspecoes = db.getAllSync(
        'SELECT * FROM inspecoes WHERE licencaId = ?',
        [row.id]
      );
      return { ...row, inspecoes };
    });
  },

  addLicenca: (licenca) => {
    db.runSync(
      `INSERT INTO licencas (id, codigo, tipoLicenca, estabelecimentoId, status, dataEmissao, dataVencimento, anexoUri, custo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        licenca.id, licenca.codigo, licenca.tipoLicenca, licenca.estabelecimentoId,
        licenca.status, licenca.dataEmissao, licenca.dataVencimento,
        licenca.anexoUri || null, licenca.custo || null,
      ]
    );
  },

  updateLicenca: (id, updates) => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    db.runSync(`UPDATE licencas SET ${setClause} WHERE id = ?`, [...values, id]);
  },

  deleteLicenca: (id) => {
    db.runSync('DELETE FROM licencas WHERE id = ?', [id]);
  },

  addInspecao: (inspecao) => {
    db.runSync(
      `INSERT INTO inspecoes (id, licencaId, data, resultado, observacoes, fiscal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        inspecao.id, inspecao.licencaId, inspecao.data, inspecao.resultado,
        inspecao.observacoes || null, inspecao.fiscal
      ]
    );
  },
};
