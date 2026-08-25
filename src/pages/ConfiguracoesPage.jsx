import React, { useState, useRef, useMemo } from 'react';
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
  ShieldCheck,
  Check,
  Ban,
  Clock,
  Phone,
  Building,
  AlertCircle,
  UserCheck,
  Eye,
  EyeOff,
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
  const approveUserMutation = useMutation(api.usuarios.approve);
  const toggleStatusMutation = useMutation(api.usuarios.toggleStatus);
  const setPermissionsMutation = useMutation(api.usuarios.setPermissions);

  const handleToggleReadPermission = async (id, userName, currentVal) => {
    const newVal = !currentVal;
    try {
      await setPermissionsMutation({
        id,
        podeLerTodos: newVal,
      });
      toast.success(`Permissão de leitura externa de "${userName}" ${newVal ? 'liberada (vê todos os dados)' : 'restrita (apenas próprios)'}.`);
    } catch (err) {
      toast.error('Erro ao atualizar permissão: ' + err.message);
    }
  };

  // Tab de gerenciamento de usuários: 'pendentes' | 'ativos'
  const [userTab, setUserTab] = useState('pendentes');

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'Fiscal Sanitário');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarMode, setAvatarMode] = useState('upload'); // 'upload' | 'url' | 'gallery'
  const fileInputRef = useRef(null);

  // Split users into pending and active
  const pendingUsers = useMemo(() => {
    return usuarios.filter((u) => u.status === 'pendente' || u.ativo === false);
  }, [usuarios]);

  const activeUsers = useMemo(() => {
    return usuarios.filter((u) => u.status !== 'pendente' && u.ativo !== false);
  }, [usuarios]);

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
  const [newTelefone, setNewTelefone] = useState('');
  const [newOrgaoSetor, setNewOrgaoSetor] = useState('');

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
        nome: newNome.trim(),
        email: newEmail.trim().toLowerCase(),
        senha: newSenha,
        role: newRole,
        telefone: newTelefone.trim() || undefined,
        orgaoSetor: newOrgaoSetor.trim() || undefined,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newNome)}&background=00796B&color=fff&size=150&bold=true`,
        ativo: true,
        status: 'aprovado',
      });
      toast.success(`Novo acesso criado e aprovado para ${newNome}!`);
      setNewNome('');
      setNewEmail('');
      setNewSenha('');
      setNewTelefone('');
      setNewOrgaoSetor('');
      setNovoAcessoOpen(false);
    } catch (err) {
      toast.error('Erro ao criar acesso: ' + err.message);
    }
  };

  const handleApproveUser = async (id, userName, userRole) => {
    try {
      await approveUserMutation({
        id,
        role: userRole,
        aprovadoPor: user?.name || 'Administrador',
      });
      toast.success(`Cadastro de "${userName}" aprovado com sucesso! O usuário já pode acessar.`);
    } catch (err) {
      toast.error('Erro ao aprovar usuário: ' + err.message);
    }
  };

  const handleToggleBlockUser = async (id, userName, currentAtivo) => {
    const novoStatus = !currentAtivo;
    const confirmMsg = novoStatus
      ? `Reativar o acesso de "${userName}"?`
      : `Bloquear o acesso de "${userName}"? Ele não conseguirá entrar até ser desbloqueado.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleStatusMutation({
        id,
        ativo: novoStatus,
      });
      toast.success(`Acesso de "${userName}" ${novoStatus ? 'reativado' : 'bloqueado'}.`);
    } catch (err) {
      toast.error('Erro ao alterar status: ' + err.message);
    }
  };

  const handleUpdateRole = async (id, newRoleValue) => {
    try {
      await updateUserMutation({
        id,
        role: newRoleValue,
      });
      toast.success('Função atualizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar cargo: ' + err.message);
    }
  };

  const handleRemoveUser = async (id, userName) => {
    if (!window.confirm(`Excluir permanentemente o cadastro de "${userName}"?`)) return;
    try {
      await removeUserMutation({ id });
      toast.success('Usuário excluído com sucesso.');
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
          Edição de perfil, moderação e aprovação de novos cadastros e preferências
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
            onClick={() => {
              if (editMode) setEditMode(false);
              else handleEditModeOpen();
            }}
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
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-block text-xs font-bold text-[#00796B] dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-md">
                    {user?.role || 'Fiscal Sanitário'}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3 mr-1" />
                    Acesso Liberado
                  </span>
                </div>
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
                    e.target.src =
                      'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome || 'U') + '&background=00796B&color=fff';
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
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
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

              {/* Avatar Gallery */}
              {avatarMode === 'gallery' && (
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_GALLERY.map((item) => (
                    <button
                      key={item.bg}
                      type="button"
                      onClick={() => setAvatarUrl(item.url)}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        avatarUrl === item.url
                          ? 'border-[#00796B] ring-2 ring-[#00796B]/40'
                          : 'border-transparent hover:border-gray-300'
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

      {/* ================= GESTÃO DE ACESSOS & APROVAÇÕES DE CADASTRO ================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#00796B]" />
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Controle de Acessos & Moderação Sanitária
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Aprove ou bloqueie novos usuários antes de liberarem visualização de dados
              </p>
            </div>
          </div>

          <button
            onClick={() => setNovoAcessoOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#00796B] text-white font-bold rounded-xl text-xs hover:bg-[#004D40] shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Acesso Direto</span>
          </button>
        </div>

        {/* Tab Selector: Pendentes vs Aprovados */}
        <div className="flex space-x-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
          <button
            onClick={() => setUserTab('pendentes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              userTab === 'pendentes'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800'
                : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Aprovações Pendentes</span>
            {pendingUsers.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setUserTab('ativos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              userTab === 'ativos'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-[#00796B] dark:text-teal-300 ring-1 ring-teal-300 dark:ring-teal-800'
                : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Usuários Aprovados & Ativos</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
              {activeUsers.length}
            </span>
          </button>
        </div>

        {/* ================= ABA 1: CADASTROS PENDENTES ================= */}
        {userTab === 'pendentes' && (
          <div>
            {pendingUsers.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-gray-50/50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm text-gray-800 dark:text-zinc-200">
                  Nenhum cadastro aguardando aprovação
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Todos os usuários cadastrados já foram revisados e liberados pelo Administrador.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                  <p>
                    Estes usuários realizaram o autocadastro, mas <strong>não conseguem visualizar os dados sanitários</strong> até que você aprove o acesso abaixo.
                  </p>
                </div>

                {pendingUsers.map((u) => (
                  <div
                    key={u._id}
                    className="p-4 rounded-2xl border-2 border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-zinc-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start space-x-3.5">
                      <img
                        src={
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome)}&background=F59E0B&color=fff&size=100`
                        }
                        alt={u.nome}
                        className="w-12 h-12 rounded-xl object-cover border border-amber-300 dark:border-amber-700 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{u.nome}</h4>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/50">
                            Pendente de Aprovação
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-zinc-400">{u.email}</p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-zinc-400 pt-0.5">
                          <span className="font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                            Cargo: {u.role}
                          </span>
                          {u.telefone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{u.telefone}</span>
                            </span>
                          )}
                          {u.orgaoSetor && (
                            <span className="flex items-center space-x-1">
                              <Building className="w-3 h-3" />
                              <span>{u.orgaoSetor}</span>
                            </span>
                          )}
                          {u.criadoEm && (
                            <span className="text-gray-400">
                              Registrado em: {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação para o Pendente */}
                    <div className="flex items-center space-x-2 self-end md:self-center">
                      <button
                        onClick={() => handleRemoveUser(u._id, u.nome)}
                        className="px-3 py-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                        title="Recusar e Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Recusar</span>
                      </button>

                      <button
                        onClick={() => handleApproveUser(u._id, u.nome, u.role)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovar Acesso</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ABA 2: USUÁRIOS ATIVOS / APROVADOS ================= */}
        {userTab === 'ativos' && (
          <div className="space-y-3">
            {activeUsers.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-zinc-400 py-6 text-center">
                Nenhum usuário ativo cadastrado além do login atual.
              </p>
            ) : (
              activeUsers.map((u) => (
                <div
                  key={u._id}
                  className="p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        u.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome)}&background=00796B&color=fff&size=100`
                      }
                      alt={u.nome}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-zinc-700"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{u.nome}</h4>
                        {u.status === 'bloqueado' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Bloqueado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Toggle Permissão de Leitura Global de Dados Externos */}
                    <button
                      onClick={() =>
                        handleToggleReadPermission(
                          u._id,
                          u.nome,
                          u.podeLerTodos ?? (u.role === 'Administrador' || u.email === 'fiscal@sigs.gov.br')
                        )
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                        (u.podeLerTodos ?? (u.role === 'Administrador' || u.email === 'fiscal@sigs.gov.br'))
                          ? 'bg-teal-50 dark:bg-teal-950 text-[#00796B] dark:text-teal-400 border-teal-200 dark:border-teal-800'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                      title={
                        (u.podeLerTodos ?? (u.role === 'Administrador' || u.email === 'fiscal@sigs.gov.br'))
                          ? 'Permissão Total: visualiza todos os dados da rede (Clique para restringir)'
                          : 'Acesso Restrito: bloqueado de ler dados externos (Clique para liberar)'
                      }
                    >
                      {(u.podeLerTodos ?? (u.role === 'Administrador' || u.email === 'fiscal@sigs.gov.br')) ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Lê Todos</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Leitura Restrita</span>
                        </>
                      )}
                    </button>

                    {/* Alterar Role rápida */}
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-medium text-gray-800 dark:text-zinc-200"
                    >
                      <option value="Fiscal Sanitário">Fiscal Sanitário</option>
                      <option value="Responsável Técnico">Responsável Técnico</option>
                      <option value="Gestor de Alvarás">Gestor de Alvarás</option>
                      <option value="Administrador">Administrador</option>
                    </select>

                    {/* Bloquear / Reativar */}
                    <button
                      onClick={() => handleToggleBlockUser(u._id, u.nome, u.ativo)}
                      className={`p-2 rounded-lg text-xs font-bold ${
                        u.ativo
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                      title={u.ativo ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                    >
                      {u.ativo ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => handleRemoveUser(u._id, u.nome)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
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
            className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-[#00796B] bg-gray-50 dark:bg-zinc-800/50 flex items-center space-x-3 text-left transition-all cursor-pointer"
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
            className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-[#00796B] bg-gray-50 dark:bg-zinc-800/50 flex items-center space-x-3 text-left transition-all cursor-pointer"
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

      {/* Modal Criar Novo Acesso (Admin direto) */}
      {novoAcessoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
            <div className="px-6 py-4 bg-gradient-to-r from-[#00796B] to-[#1565C0] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-6 h-6" />
                <h2 className="font-bold text-lg">Criar Novo Acesso Direto</h2>
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
                  placeholder="Ex: Dra. Ana Beatriz"
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
                  placeholder="ana.beatriz@empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={newTelefone}
                    onChange={(e) => setNewTelefone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                    Órgão / Setor
                  </label>
                  <input
                    type="text"
                    placeholder="VISA Municipal"
                    value={newOrgaoSetor}
                    onChange={(e) => setNewOrgaoSetor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-[#00796B] focus:outline-none"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00796B] text-white font-bold rounded-xl shadow-md text-xs hover:bg-[#004D40] cursor-pointer"
                >
                  Criar e Ativar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
