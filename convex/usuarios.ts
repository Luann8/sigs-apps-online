import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("usuarios").collect();
    return users.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("usuarios").collect();
    return users.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const emailNorm = args.email.trim().toLowerCase();
    return await ctx.db
      .query("usuarios")
      .withIndex("by_email", (q) => q.eq("email", emailNorm))
      .first();
  },
});

export const authenticate = mutation({
  args: {
    email: v.string(),
    senha: v.string(),
  },
  handler: async (ctx, args) => {
    const emailNorm = args.email.trim().toLowerCase();
    let user = await ctx.db
      .query("usuarios")
      .withIndex("by_email", (q) => q.eq("email", emailNorm))
      .first();

    // Fallback: busca sem índice se necessário
    if (!user) {
      const all = await ctx.db.query("usuarios").collect();
      user = all.find((u) => u.email.trim().toLowerCase() === emailNorm) || null;
    }

    // Se for o login padrão do fiscal/admin e ainda não existir no banco, inicializa automaticamente
    if (!user && emailNorm === "fiscal@sigs.gov.br" && args.senha === "123456") {
      const defaultAvatar = `https://ui-avatars.com/api/?name=Fiscal+Sanitario&background=00796B&color=fff&size=150&bold=true`;
      const id = await ctx.db.insert("usuarios", {
        nome: "Fiscal Sanitário",
        email: "fiscal@sigs.gov.br",
        senha: "123456",
        role: "Administrador",
        avatar: defaultAvatar,
        ativo: true,
        status: "aprovado",
        podeLerTodos: true,
        podeEditar: true,
        criadoEm: new Date().toISOString(),
      });
      user = await ctx.db.get(id);
    }

    if (!user) {
      throw new Error("Usuário não encontrado. Crie uma conta na aba Cadastrar.");
    }

    if (user.senha !== args.senha) {
      throw new Error("Senha incorreta.");
    }

    return {
      id: user._id,
      name: user.nome,
      email: user.email,
      role: user.role || "Fiscal Sanitário",
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=00796B&color=fff&size=150`,
      telefone: user.telefone,
      orgaoSetor: user.orgaoSetor,
      status: user.status || "aprovado",
      ativo: user.ativo ?? true,
      podeLerTodos: user.podeLerTodos ?? (user.role === "Administrador" || user.email === "fiscal@sigs.gov.br"),
      podeEditar: user.podeEditar ?? (user.role === "Administrador" || user.email === "fiscal@sigs.gov.br"),
    };
  },
});

export const register = mutation({
  args: {
    nome: v.string(),
    email: v.string(),
    senha: v.string(),
    role: v.optional(v.string()),
    telefone: v.optional(v.string()),
    orgaoSetor: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailNorm = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("usuarios")
      .withIndex("by_email", (q) => q.eq("email", emailNorm))
      .first();

    if (existing) {
      throw new Error("Já existe uma conta com este e-mail. Faça o login.");
    }

    const id = await ctx.db.insert("usuarios", {
      nome: args.nome.trim(),
      email: emailNorm,
      senha: args.senha,
      role: args.role || "Fiscal Sanitário",
      telefone: args.telefone,
      orgaoSetor: args.orgaoSetor,
      avatar: args.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(args.nome)}&background=00796B&color=fff`,
      ativo: true,
      status: "aprovado",
      podeLerTodos: true,
      podeEditar: true,
      criadoEm: new Date().toISOString(),
    });

    const created = await ctx.db.get(id);
    return {
      id: created!._id,
      name: created!.nome,
      email: created!.email,
      role: created!.role,
      avatar: created!.avatar,
      podeLerTodos: true,
      podeEditar: true,
      ativo: true,
      status: "aprovado",
    };
  },
});

export const create = register;
export const add = register;

export const update = mutation({
  args: {
    id: v.id("usuarios"),
    nome: v.optional(v.string()),
    email: v.optional(v.string()),
    senha: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
    ativo: v.optional(v.boolean()),
    podeLerTodos: v.optional(v.boolean()),
    podeEditar: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("pendente"), v.literal("aprovado"), v.literal("bloqueado"))),
    telefone: v.optional(v.string()),
    orgaoSetor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleaned);
  },
});

export const approve = mutation({
  args: {
    id: v.id("usuarios"),
    role: v.optional(v.string()),
    aprovadoPor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {
      ativo: true,
      status: "aprovado",
      podeLerTodos: true,
      podeEditar: true,
      aprovadoEm: new Date().toISOString(),
    };
    if (args.role) updates.role = args.role;
    if (args.aprovadoPor) updates.aprovadoPor = args.aprovadoPor;

    await ctx.db.patch(args.id, updates);
  },
});

export const setPermissions = mutation({
  args: {
    id: v.id("usuarios"),
    podeLerTodos: v.boolean(),
    podeEditar: v.optional(v.boolean()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {
      podeLerTodos: args.podeLerTodos,
    };
    if (args.podeEditar !== undefined) updates.podeEditar = args.podeEditar;
    if (args.role) updates.role = args.role;

    await ctx.db.patch(args.id, updates);
  },
});

export const toggleStatus = mutation({
  args: {
    id: v.id("usuarios"),
    ativo: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ativo: args.ativo,
      status: args.ativo ? "aprovado" : "bloqueado",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("usuarios") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
