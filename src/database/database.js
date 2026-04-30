import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sigs.db');

export const initDatabase = () => {

  db.execSync(`
    CREATE TABLE IF NOT EXISTS licencas (
      id TEXT PRIMARY KEY NOT NULL,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      endereco TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      responsavel TEXT NOT NULL,
      crmv TEXT,
      tipo TEXT NOT NULL,
      status TEXT NOT NULL,
      dataEmissao TEXT NOT NULL,
      dataVencimento TEXT NOT NULL
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
};

export const DatabaseService = {
  getLicencas: () => {
    const rows = db.getAllSync('SELECT * FROM licencas ORDER BY dataVencimento ASC');
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
      `INSERT INTO licencas (id, codigo, nome, cnpj, endereco, telefone, email, responsavel, crmv, tipo, status, dataEmissao, dataVencimento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        licenca.id, licenca.codigo, licenca.nome, licenca.cnpj, licenca.endereco,
        licenca.telefone, licenca.email, licenca.responsavel, licenca.crmv || null,
        licenca.tipo, licenca.status, licenca.dataEmissao, licenca.dataVencimento
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
