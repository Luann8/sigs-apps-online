import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByEstabelecimento = query({
  args: { estabelecimentoId: v.id("estabelecimentos") },
  handler: async (ctx, args) => {
    const licencas = await ctx.db
      .query("licencas")
      .withIndex("by_estabelecimento", (q) =>
        q.eq("estabelecimentoId", args.estabelecimentoId)
      )
      .collect();

    const licencasComInspecoes = await Promise.all(
      licencas.map(async (licenca) => {
        const inspecoes = await ctx.db
          .query("inspecoes")
          .withIndex("by_licenca", (q) => q.eq("licencaId", licenca._id))
          .collect();
        return { ...licenca, inspecoes };
      })
    );

    return licencasComInspecoes;
  },
});

export const getById = query({
  args: { id: v.id("licencas") },
  handler: async (ctx, args) => {
    const licenca = await ctx.db.get(args.id);
    if (!licenca) return null;
    const inspecoes = await ctx.db
      .query("inspecoes")
      .withIndex("by_licenca", (q) => q.eq("licencaId", args.id))
      .collect();
    return { ...licenca, inspecoes };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const licencas = await ctx.db.query("licencas").collect();
    return licencas;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("licencas").collect();
  },
});

export const create = mutation({
  args: {
    estabelecimentoId: v.id("estabelecimentos"),
    codigo: v.string(),
    tipoLicenca: v.string(),
    status: v.string(),
    dataEmissao: v.string(),
    dataVencimento: v.string(),
    anexoUri: v.optional(v.string()),
    custo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("licencas", {
      ...args,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const add = mutation({
  args: {
    estabelecimentoId: v.id("estabelecimentos"),
    codigo: v.string(),
    tipoLicenca: v.string(),
    status: v.string(),
    dataEmissao: v.string(),
    dataVencimento: v.string(),
    anexoUri: v.optional(v.string()),
    custo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("licencas", {
      ...args,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("licencas"),
    codigo: v.optional(v.string()),
    tipoLicenca: v.optional(v.string()),
    status: v.optional(v.string()),
    dataEmissao: v.optional(v.string()),
    dataVencimento: v.optional(v.string()),
    anexoUri: v.optional(v.string()),
    custo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleaned);
  },
});

export const remove = mutation({
  args: { id: v.id("licencas") },
  handler: async (ctx, args) => {
    const inspecoes = await ctx.db
      .query("inspecoes")
      .withIndex("by_licenca", (q) => q.eq("licencaId", args.id))
      .collect();
    for (const inspecao of inspecoes) {
      await ctx.db.delete(inspecao._id);
    }
    await ctx.db.delete(args.id);
  },
});
