import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("estabelecimentos").collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("estabelecimentos").collect();
  },
});

export const getById = query({
  args: { id: v.id("estabelecimentos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    nome: v.string(),
    cnpj: v.string(),
    endereco: v.string(),
    telefone: v.optional(v.string()),
    email: v.optional(v.string()),
    responsavel: v.string(),
    crmv: v.optional(v.string()),
    tipo: v.union(v.literal("veterinaria"), v.literal("sanitaria")),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("estabelecimentos", {
      ...args,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const add = mutation({
  args: {
    nome: v.string(),
    cnpj: v.string(),
    endereco: v.string(),
    telefone: v.optional(v.string()),
    email: v.optional(v.string()),
    responsavel: v.string(),
    crmv: v.optional(v.string()),
    tipo: v.union(v.literal("veterinaria"), v.literal("sanitaria")),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("estabelecimentos", {
      ...args,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("estabelecimentos"),
    nome: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    endereco: v.optional(v.string()),
    telefone: v.optional(v.string()),
    email: v.optional(v.string()),
    responsavel: v.optional(v.string()),
    crmv: v.optional(v.string()),
    tipo: v.optional(v.union(v.literal("veterinaria"), v.literal("sanitaria"))),
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
  args: { id: v.id("estabelecimentos") },
  handler: async (ctx, args) => {
    const licencas = await ctx.db
      .query("licencas")
      .withIndex("by_estabelecimento", (q) =>
        q.eq("estabelecimentoId", args.id)
      )
      .collect();

    for (const licenca of licencas) {
      const inspecoes = await ctx.db
        .query("inspecoes")
        .withIndex("by_licenca", (q) => q.eq("licencaId", licenca._id))
        .collect();
      for (const inspecao of inspecoes) {
        await ctx.db.delete(inspecao._id);
      }
      await ctx.db.delete(licenca._id);
    }

    await ctx.db.delete(args.id);
  },
});
