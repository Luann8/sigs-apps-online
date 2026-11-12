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
    usuariosIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("estabelecimentos", {
      ...args,
      userId: userId?.subject ?? "default_user",
      usuariosIds: args.usuariosIds ?? [],
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
    usuariosIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("estabelecimentos", {
      ...args,
      userId: userId?.subject ?? "default_user",
      usuariosIds: args.usuariosIds ?? [],
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
    usuariosIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleaned);
  },
});

export const setUsuarios = mutation({
  args: {
    estabelecimentoId: v.id("estabelecimentos"),
    usuariosIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const est = await ctx.db.get(args.estabelecimentoId);
    if (!est) throw new Error("Estabelecimento não encontrado");

    const oldUserIds = est.usuariosIds || [];
    const newUserIds = args.usuariosIds;

    await ctx.db.patch(args.estabelecimentoId, {
      usuariosIds: newUserIds,
    });

    const estStrId = String(args.estabelecimentoId);

    // 1. Remove das contas que foram desmarcadas
    const removed = oldUserIds.filter((uId) => !newUserIds.includes(uId));
    for (const uId of removed) {
      try {
        const userDoc = await ctx.db.get(uId as any);
        if (userDoc) {
          const u = userDoc as any;
          if (Array.isArray(u.estabelecimentosIds)) {
            const updated = (u.estabelecimentosIds as string[]).filter(
              (eId: string) => eId !== estStrId
            );
            await ctx.db.patch(u._id, { estabelecimentosIds: updated } as any);
          }
        }
      } catch {
        // ignora se ID não existir
      }
    }

    // 2. Adiciona nas contas recém-marcadas
    const added = newUserIds.filter((uId) => !oldUserIds.includes(uId));
    for (const uId of added) {
      try {
        const userDoc = await ctx.db.get(uId as any);
        if (userDoc) {
          const u = userDoc as any;
          const cur: string[] = u.estabelecimentosIds || [];
          if (!cur.includes(estStrId)) {
            await ctx.db.patch(u._id, {
              estabelecimentosIds: [...cur, estStrId],
            } as any);
          }
        }
      } catch {
        // ignora se ID não existir
      }
    }
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
