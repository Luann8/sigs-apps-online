import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  estabelecimentos: defineTable({
    nome: v.string(),
    cnpj: v.string(),
    endereco: v.string(),
    telefone: v.optional(v.string()),
    email: v.optional(v.string()),
    responsavel: v.string(),
    crmv: v.optional(v.string()),
    tipo: v.union(v.literal("veterinaria"), v.literal("sanitaria")),
    userId: v.string(),
  }).index("by_user", ["userId"]),

  licencas: defineTable({
    estabelecimentoId: v.id("estabelecimentos"),
    codigo: v.string(),
    tipoLicenca: v.string(),
    status: v.string(),
    dataEmissao: v.string(),
    dataVencimento: v.string(),
    anexoUri: v.optional(v.string()),
    custo: v.optional(v.number()),
    userId: v.string(),
  })
    .index("by_estabelecimento", ["estabelecimentoId"])
    .index("by_user", ["userId"]),

  inspecoes: defineTable({
    licencaId: v.id("licencas"),
    data: v.string(),
    resultado: v.string(),
    observacoes: v.optional(v.string()),
    fiscal: v.string(),
    userId: v.string(),
  }).index("by_licenca", ["licencaId"]),

  eventos: defineTable({
    titulo: v.string(),
    data: v.string(),
    descricao: v.optional(v.string()),
    tipo: v.string(),
    licencaId: v.optional(v.id("licencas")),
    estabelecimentoId: v.optional(v.id("estabelecimentos")),
    concluido: v.boolean(),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_data", ["data"]),

  usuarios: defineTable({
    nome: v.string(),
    email: v.string(),
    senha: v.string(),
    role: v.string(),
    avatar: v.optional(v.string()),
    ativo: v.boolean(),
    status: v.optional(v.union(v.literal("pendente"), v.literal("aprovado"), v.literal("bloqueado"))),
    telefone: v.optional(v.string()),
    orgaoSetor: v.optional(v.string()),
    criadoEm: v.optional(v.string()),
    aprovadoPor: v.optional(v.string()),
    aprovadoEm: v.optional(v.string()),
    podeLerTodos: v.optional(v.boolean()),
    podeEditar: v.optional(v.boolean()),
    solicitouLeitura: v.optional(v.boolean()),
  }).index("by_email", ["email"]),
});
