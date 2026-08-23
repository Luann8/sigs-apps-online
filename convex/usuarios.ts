import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("usuarios").collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("usuarios").collect();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usuarios")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const create = mutation({
  args: {
    nome: v.string(),
    email: v.string(),
    senha: v.string(),
    role: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("usuarios")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Já existe uma conta cadastrada com este e-mail.");
    }

    return await ctx.db.insert("usuarios", {
      ...args,
      ativo: true,
    });
  },
});

export const add = mutation({
  args: {
    nome: v.string(),
    email: v.string(),
    senha: v.string(),
    role: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("usuarios")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Já existe uma conta cadastrada com este e-mail.");
    }

    return await ctx.db.insert("usuarios", {
      ...args,
      ativo: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("usuarios"),
    nome: v.optional(v.string()),
    email: v.optional(v.string()),
    senha: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
    ativo: v.optional(v.boolean()),
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
  args: { id: v.id("usuarios") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
