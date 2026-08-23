import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const createUserMutation = useMutation(api.usuarios.create);

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  // Login state
  const [email, setEmail] = useState('fiscal@sigs.gov.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register state
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regRole, setRegRole] = useState('Fiscal Sanitário');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Informe seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      } else {
        toast.error('Credenciais inválidas.');
      }
      setIsSubmitting(false);
    }, 300);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regNome || !regEmail || !regSenha) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(regNome)}&background=00796B&color=fff&size=150`;
      await createUserMutation({
        nome: regNome,
        email: regEmail,
        senha: regSenha,
        role: regRole,
        avatar: avatarUrl,
      });

      login(regEmail, regSenha, {
        id: `user_${Date.now()}`,
        name: regNome,
        email: regEmail,
        role: regRole,
        avatar: avatarUrl,
      });

      toast.success(`Conta criada com sucesso! Bem-vindo, ${regNome}.`);
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00796B] to-[#1565C0] flex items-center justify-center shadow-lg text-white mx-auto">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight">
              SIGS Web
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-medium">
              Sistema de Gestão de Licenças & Vigilância Sanitária
            </p>
          </div>
        </div>

        {/* Login / Register Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-gray-100 dark:border-zinc-800 pb-3 space-x-4">
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-2 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'login'
                  ? 'border-[#00796B] text-[#00796B] dark:text-teal-400'
                  : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-zinc-500'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`pb-2 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'register'
                  ? 'border-[#00796B] text-[#00796B] dark:text-teal-400'
                  : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-zinc-500'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastro</span>
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 text-gray-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-gray-300 text-[#00796B] focus:ring-[#00796B]"
                  />
                  <span>Lembrar-me</span>
                </label>

                <button
                  type="button"
                  onClick={() => toast.info('Entre em contato com o administrador para redefinir sua senha.')}
                  className="text-[#00796B] dark:text-teal-400 font-semibold hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{isSubmitting ? 'Acessando...' : 'Entrar no Sistema'}</span>
              </button>


            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Dr. Fernando Alves"
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  E-mail do Novo Usuário *
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="novo.usuario@empresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Função / Cargo *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                >
                  <option value="Fiscal Sanitário">Fiscal Sanitário</option>
                  <option value="Responsável Técnico">Responsável Técnico</option>
                  <option value="Gestor de Alvarás">Gestor de Alvarás</option>
                  <option value="Administrador">Administrador do Sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                <span>{isSubmitting ? 'Cadastrando...' : 'Criar Novo Acesso'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
