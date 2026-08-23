import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByLicenca = query({
  args: { licencaId: v.id("licencas") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inspecoes")
      .withIndex("by_licenca", (q) => q.eq("licencaId", args.licencaId))
      .collect();
  },
});

export const create = mutation({
  args: {
    licencaId: v.id("licencas"),
    data: v.string(),
    resultado: v.string(),
    observacoes: v.optional(v.string()),
    fiscal: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("inspecoes", {
      ...args,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const add = mutation({
  args: {
    licencaId: v.id("licencas"),
    data: v.string(),
    resultado: v.string(),
    observacoes: v.optional(v.string()),
    fiscal: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("inspecoes", {
      ...args,
      userId: userId?.subject ?? "default_user",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("inspecoes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
