import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("eventos").collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("eventos").collect();
  },
});

export const create = mutation({
  args: {
    titulo: v.string(),
    data: v.string(),
    descricao: v.optional(v.string()),
    tipo: v.string(),
    licencaId: v.optional(v.id("licencas")),
    estabelecimentoId: v.optional(v.id("estabelecimentos")),
    concluido: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("eventos", {
      ...args,
      concluido: args.concluido ?? false,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const add = mutation({
  args: {
    titulo: v.string(),
    data: v.string(),
    descricao: v.optional(v.string()),
    tipo: v.string(),
    licencaId: v.optional(v.id("licencas")),
    estabelecimentoId: v.optional(v.id("estabelecimentos")),
    concluido: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("eventos", {
      ...args,
      concluido: args.concluido ?? false,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const toggleConcluido = mutation({
  args: { id: v.id("eventos") },
  handler: async (ctx, args) => {
    const evento = await ctx.db.get(args.id);
    if (evento) {
      await ctx.db.patch(args.id, { concluido: !evento.concluido });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("eventos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
