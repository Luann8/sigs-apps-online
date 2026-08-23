#!/usr/bin/env node

/**
 * Script de seed: Migra dados do SQLite local para o Convex.
 *
 * Execute com: node scripts/seedConvex.js
 *
 * Pré-requisitos:
 * 1. Ter um projeto Convex rodando (npx convex dev)
 * 2. Ter os dados no SQLite local (app já utilizado)
 * 3. Estar autenticado no Convex CLI
 *
 * Este script:
 * 1. Lê todos os estabelecimentos do SQLite
 * 2. Para cada estabelecimento, insere no Convex e obtém o novo _id
 * 3. Mapeia licenças e inspcões usando os novos IDs
 * 4. Faz upload de todos os dados para o Convex
 */

const { ConvexClient } = require("convex/browser");

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("EXPO_PUBLIC_CONVEX_URL não definido. Configure o .env.local primeiro.");
  process.exit(1);
}

const API = require("../convex/_generated/api");

async function seed() {
  console.log("Iniciando migração SQLite → Convex...");
  console.log(`URL do Convex: ${CONVEX_URL}`);

  const client = new ConvexClient(CONVEX_URL);

  try {
    // TODO: Implementar leitura do SQLite local
    // O script precisa ser executado em um ambiente que tenha acesso ao SQLite
    // Alternativa: usar o app para exportar os dados em JSON e importar aqui

    console.log("\nEste script precisa ser adaptado para ler o SQLite local.");
    console.log("Alternativa recomendada:");
    console.log("1. Use a funcionalidade de backup (exportar JSON) no app");
    console.log("2. Adapte este script para ler o JSON exportado");
    console.log("3. Execute: node scripts/seedConvex.js <caminho-do-backup.json>");

    const fs = require("fs");
    const backupPath = process.argv[2];

    if (backupPath && fs.existsSync(backupPath)) {
      console.log(`\nLendo backup de: ${backupPath}`);
      const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));

      if (backup.app !== "SIGS") {
        console.error("Arquivo não é um backup válido do SIGS.");
        process.exit(1);
      }

      console.log(`Encontrados ${backup.estabelecimentos.length} estabelecimentos`);
      console.log(`Encontradas ${backup.licencas.length} licenças`);

      // Mapa de IDs antigos → novos IDs do Convex
      const idMap = new Map();

      // 1. Migrar estabelecimentos
      console.log("\nMigrando estabelecimentos...");
      for (const est of backup.estabelecimentos) {
        try {
          const newId = await client.mutation(API.estabelecimentos.create, {
            nome: est.nome,
            cnpj: est.cnpj,
            endereco: est.endereco,
            telefone: est.telefone || undefined,
            email: est.email || undefined,
            responsavel: est.responsavel,
            crmv: est.crmv || undefined,
            tipo: est.tipo,
          });
          idMap.set(est.id, newId);
          console.log(`  ✓ ${est.nome} → ${newId}`);
        } catch (err) {
          console.error(`  ✗ Erro ao migrar "${est.nome}":`, err.message);
        }
      }

      // 2. Migrar licenças
      console.log("\nMigrando licenças...");
      for (const lic of backup.licencas) {
        const newEstId = idMap.get(lic.estabelecimentoId);
        if (!newEstId) {
          console.log(`  ⊘ Pulando licença ${lic.codigo} (estabelecimento não migrado)`);
          continue;
        }

        try {
          const newLicId = await client.mutation(API.licencas.create, {
            estabelecimentoId: newEstId,
            codigo: lic.codigo,
            tipoLicenca: lic.tipoLicenca,
            status: lic.status,
            dataEmissao: lic.dataEmissao,
            dataVencimento: lic.dataVencimento,
            anexoUri: lic.anexoUri || undefined,
            custo: lic.custo || undefined,
          });

          // 3. Migrar inspeções
          if (Array.isArray(lic.inspecoes)) {
            for (const insp of lic.inspecoes) {
              try {
                await client.mutation(API.inspecoes.create, {
                  licencaId: newLicId,
                  data: insp.data,
                  resultado: insp.resultado,
                  observacoes: insp.observacoes || undefined,
                  fiscal: insp.fiscal,
                });
              } catch (err) {
                console.log(`    ⊘ Inspeção duplicada ou inválida, pulando`);
              }
            }
          }

          console.log(`  ✓ ${lic.codigo} → ${newLicId}`);
        } catch (err) {
          console.error(`  ✗ Erro ao migrar licença "${lic.codigo}":`, err.message);
        }
      }

      console.log("\n✓ Migração concluída!");
      console.log(`  Estabelecimentos: ${idMap.size}/${backup.estabelecimentos.length}`);
    }
  } catch (err) {
    console.error("Erro durante a migração:", err);
  } finally {
    client.close();
  }
}

seed();
