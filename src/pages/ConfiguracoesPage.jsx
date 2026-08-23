import React, { useState, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { exportarBackupJSON, downloadCSV } from '../utils/backupHelper';
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Download,
  Database,
  User,
  LogOut,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  Users,
  X,
  Camera,
  ImagePlus,
  Link,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user, logout, updateProfile } = useAuthStore();
  const {
    theme,
    setTheme,
    alertasAtivos,
    setAlertasAtivos,
    diasAntecedencia,
    setDiasAntecedencia,
  } = useSettingsStore();

  const estabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const licencas = useQuery(api.licencas.listAll) ?? [];
  const usuarios = useQuery(api.usuarios.listAll) ?? [];

  const createUserMutation = useMutation(api.usuarios.create);
  const removeUserMutation = useMutation(api.usuarios.remove);
  const updateUserMutation = useMutation(api.usuarios.update);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'Fiscal Sanitário');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarMode, setAvatarMode] = useState('upload'); // 'upload' | 'url' | 'gallery'
  const fileInputRef = useRef(null);

  // Avatar gallery: generated avatars with initials + color combos
  const AVATAR_GALLERY = [
    { bg: '00796B', color: 'fff', label: 'Verde' },
    { bg: '1565C0', color: 'fff', label: 'Azul' },
    { bg: '6A1B9A', color: 'fff', label: 'Roxo' },
    { bg: 'C62828', color: 'fff', label: 'Vermelho' },
    { bg: 'E65100', color: 'fff', label: 'Laranja' },
    { bg: '37474F', color: 'fff', label: 'Cinza' },
    { bg: 'F9A825', color: '333', label: 'Amarelo' },
    { bg: '00838F', color: 'fff', label: 'Ciano' },
  ].map(({ bg, color, label }) => ({
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nome || user?.name || 'U')}&background=${bg}&color=${color}&size=150&bold=true`,
    label,
    bg,
  }));

  // New access modal state
  const [novoAcessoOpen, setNovoAcessoOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Fiscal Sanitário');
  const [newSenha, setNewSenha] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const finalAvatar = avatarUrl || user?.avatar;
    updateProfile({
      name: nome,
      email: email,
      role: role,
      avatar: finalAvatar,
    });

    if (user?.id && typeof user.id === 'string' && !user.id.startsWith('user_')) {
      try {
        await updateUserMutation({
          id: user.id,
          nome,
          email,
          role,
          avatar: finalAvatar,
        });
      } catch (err) {
        console.error('Erro ao atualizar usuário no Convex:', err);
      }
    }

    toast.success('Perfil atualizado com sucesso!');
    setEditMode(false);
  };

  const handleEditModeOpen = () => {
    setNome(user?.name || '');
    setEmail(user?.email || '');
    setRole(user?.role || '');
    setAvatarUrl(user?.avatar || '');
    setAvatarMode('upload');
    setEditMode(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreateAccess = async (e) => {
    e.preventDefault();
    if (!newNome || !newEmail || !newSenha) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      await createUserMutation({
        nome: newNome,
        email: newEmail,
        senha: newSenha,
        role: newRole,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newNome)}&background=00796B&color=fff&size=150&bold=true`,
      });
      toast.success(`Novo acesso criado para ${newNome}!`);
      setNewNome('');
      setNewEmail('');
      setNewSenha('');
      setNovoAcessoOpen(false);
    } catch (err) {
      toast.error('Erro ao criar acesso: ' + err.message);
    }
  };

  const handleRemoveUser = async (id, userName) => {
    if (!window.confirm(`Revogar o acesso de "${userName}"?`)) return;
    try {
      await removeUserMutation({ id });
      toast.success('Acesso removido com sucesso.');
    } catch (err) {
      toast.error('Erro ao remover usuário: ' + err.message);
    }
  };

  const handleExportBackup = () => {
    exportarBackupJSON(estabelecimentos, licencas);
    toast.success('Backup exportado em formato JSON!');
  };

  const handleExportCSVAll = () => {
    const data = licencas.map((l) => ({
      Codigo: l.codigo,
      Tipo: l.tipoLicenca,
      Status: l.status,
      Emissao: l.dataEmissao,
      Vencimento: l.dataVencimento,
      Custo: l.custo || 0,
    }));
    downloadCSV(data, `sigs-completo-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Relatório CSV baixado com sucesso!');
  };

  const handleLogout = () => {
    logout();
    toast.info('Você saiu da sua conta.');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Edição de perfil, criação de acessos da equipe e preferências
        </p>
      </div>

      {/* User Profile & Edit Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#00796B]" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Seu Perfil de Acesso</h2>
          </div>

          <button
            onClick={() => { if (editMode) setEditMode(false); else handleEditModeOpen(); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-300 font-bold rounded-xl text-xs"
          >
            <Edit className="w-4 h-4" />
            <span>{editMode ? 'Cancelar' : 'Editar Perfil'}</span>
          </button>
        </div>

        {!editMode ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name || 'User'}
                className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-zinc-700 shadow-xs"
              />
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{user?.name}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{user?.email}</p>
                <span className="inline-block mt-1 text-xs font-bold text-[#00796B] dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-md">
                  {user?.role || 'Gestor'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-bold rounded-xl text-xs hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            {/* Avatar Preview + Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                Foto de Perfil
              </label>

              <div className="flex items-center space-x-4">
                <img
                  src={avatarUrl || user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome || 'U')}
                  alt="preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00796B]/30 shadow"
                  onError={(e) => {
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome || 'U') + '&background=00796B&color=fff';
                  }}
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setAvatarMode('upload')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 border transition-colors ${
                        avatarMode === 'upload'
                          ? 'border-[#00796B] bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarMode('url')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 border transition-colors ${
                        avatarMode === 'url'
                          ? 'border-[#00796B] bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>Link URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarMode('gallery')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 border transition-colors ${
                        avatarMode === 'gallery'
                          ? 'border-[#00796B] bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500'
                      }`}
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Cores</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              {avatarMode === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl py-4 px-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#00796B] hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors"
                >
                  <Camera className="w-6 h-6 text-gray-400" />
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-400">Clique para enviar uma foto</p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">JPG, PNG ou GIF — máx. 2MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}

              {/* URL Input */}
              {avatarMode === 'url' && (
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                />
              )}

              {/* Avatar Gallery - color avatars */}
              {avatarMode === 'gallery' && (
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_GALLERY.map((item) => (
                    <button
                      key={item.bg}
                      type="button"
                      onClick={() => setAvatarUrl(item.url)}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        avatarUrl === item.url ? 'border-[#00796B] ring-2 ring-[#00796B]/40' : 'border-transparent hover:border-gray-300'
                      }`}
                      title={item.label}
                    >
                      <img src={item.url} alt={item.label} className="w-full h-12 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Cargo / Função no Sistema
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-700 font-semibold text-xs rounded-xl text-gray-700 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00796B] text-white font-bold rounded-xl text-xs hover:bg-[#004D40]"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Team Access Management Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#00796B]" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Gerenciamento de Acessos da Equipe</h2>
          </div>

          <button
            onClick={() => setNovoAcessoOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00796B] text-white font-bold rounded-xl text-xs hover:bg-[#004D40]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Novo Acesso</span>
          </button>
        </div>

        {usuarios.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-zinc-400 py-4 text-center">
            Nenhum outro usuário cadastrado no banco de dados ainda. Clique em "Criar Novo Acesso" para adicionar membros da equipe.
          </p>
        ) : (
          <div className="space-y-3">
            {usuarios.map((u) => (
              <div
                key={u._id}
                className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{u.nome}</h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{u.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded">
                    {u.role}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveUser(u._id, u.nome)}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  title="Revogar Acesso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          <Sun className="w-5 h-5 text-[#00796B]" />
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Aparência & Tema</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex items-center justify-center space-x-3 transition-all ${
              theme === 'light'
                ? 'border-[#00796B] bg-[#00796B]/5 text-[#00796B] font-bold ring-1 ring-[#00796B]'
                : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Modo Claro</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex items-center justify-center space-x-3 transition-all ${
              theme === 'dark'
                ? 'border-[#00796B] bg-[#00796B]/20 text-[#4DB6AC] font-bold ring-1 ring-[#00796B]'
                : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Modo Escuro</span>
          </button>
        </div>
      </div>

      {/* Data Backup & Export */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          <Database className="w-5 h-5 text-[#00796B]" />
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Exportação & Backup</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportBackup}
            className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-[#00796B] bg-gray-50 dark:bg-zinc-800/50 flex items-center space-x-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#00796B] dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Exportar Backup JSON</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Baixar arquivo de segurança</p>
            </div>
          </button>

          <button
            onClick={handleExportCSVAll}
            className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-[#00796B] bg-gray-50 dark:bg-zinc-800/50 flex items-center space-x-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Relatório CSV Completo</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Abrir no Excel / Google Sheets</p>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Criar Novo Acesso */}
      {novoAcessoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
            <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-6 h-6" />
                <h2 className="font-bold text-lg">Criar Novo Acesso da Equipe</h2>
              </div>
              <button onClick={() => setNovoAcessoOpen(false)} className="p-1 rounded-lg hover:bg-white/20 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccess} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Dr. Fernando Alves"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  placeholder="fernando@empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Cargo / Função *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  >
                    <option value="Fiscal Sanitário">Fiscal Sanitário</option>
                    <option value="Responsável Técnico">Responsável Técnico</option>
                    <option value="Gestor de Alvarás">Gestor de Alvarás</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Senha Inicial *
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newSenha}
                    onChange={(e) => setNewSenha(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNovoAcessoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00796B] text-white font-bold rounded-xl shadow-md text-xs hover:bg-[#004D40]"
                >
                  Criar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
