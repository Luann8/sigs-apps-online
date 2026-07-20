import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { useLicencasStore } from '../store/licencasStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/colors';
import { generateId } from '../utils/formatters';

const TIPOS = [
  { key: 'veterinaria', label: 'Veterinária', icon: 'paw' },
  { key: 'sanitaria', label: 'Sanitária', icon: 'medical-bag' },
];

// ── Componente de campo de formulário ───────────────────────────────────────
function FormField({ label, value, onChangeText, placeholder, icon, keyboardType, error, required, autoCapitalize }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>
        {label} {required && <Text style={fieldStyles.required}>*</Text>}
      </Text>
      <View style={[
        fieldStyles.inputRow,
        isFocused && fieldStyles.inputRowFocused,
        error && fieldStyles.inputRowError,
      ]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={error ? Colors.error : (isFocused ? Colors.primary : Colors.textSecondary)}
        />
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDisabled}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'words'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error && (
        <Text style={fieldStyles.error}>
          <MaterialCommunityIcons name="alert-circle" size={14} /> {error}
        </Text>
      )}
    </View>
  );
}

// ── Card de Estabelecimento ─────────────────────────────────────────────────
function EstabelecimentoCard({ est, onPress, onEdit, onDelete }) {
  const tipoIcon = est.tipo === 'veterinaria' ? 'paw' : 'medical-bag';
  const tipoColor = est.tipo === 'veterinaria' ? Colors.veterinaria : Colors.sanitaria;
  const tipoBg = est.tipo === 'veterinaria' ? Colors.veterinariaBg : Colors.sanitariaBg;

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.md]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Faixa lateral colorida */}
      <View style={[styles.cardAccent, { backgroundColor: tipoColor }]} />

      <View style={styles.cardBody}>
        <View style={[styles.cardIconWrap, { backgroundColor: tipoBg }]}>
          <MaterialCommunityIcons name={tipoIcon} size={26} color={tipoColor} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardNome} numberOfLines={1}>{est.nome}</Text>
          <Text style={styles.cardCnpj}>{est.cnpj}</Text>
          <View style={styles.cardMeta}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.cardEndereco} numberOfLines={1}>{est.endereco}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.cardActionBtn}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.cardActionBtn}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Tela Principal ──────────────────────────────────────────────────────────
export function EstabelecimentosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    estabelecimentos,
    loadEstabelecimentos,
    addEstabelecimento,
    updateEstabelecimento,
    deleteEstabelecimento,
    setEstabelecimentoAtual,
  } = useEstabelecimentosStore();

  const loadLicencas = useLicencasStore((s) => s.loadLicencas);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEst, setEditingEst] = useState(null);

  // Form state
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [crmv, setCrmv] = useState('');
  const [tipo, setTipo] = useState('veterinaria');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadEstabelecimentos();
  }, []);

  function openModal(est = null) {
    if (est) {
      setEditingEst(est);
      setNome(est.nome);
      setCnpj(est.cnpj);
      setEndereco(est.endereco);
      setTelefone(est.telefone || '');
      setEmail(est.email || '');
      setResponsavel(est.responsavel);
      setCrmv(est.crmv || '');
      setTipo(est.tipo);
    } else {
      setEditingEst(null);
      resetForm();
    }
    setErrors({});
    setModalVisible(true);
  }

  function resetForm() {
    setNome('');
    setCnpj('');
    setEndereco('');
    setTelefone('');
    setEmail('');
    setResponsavel('');
    setCrmv('');
    setTipo('veterinaria');
    setErrors({});
  }

  function formatCnpj(text) {
    const digits = text.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  function validate() {
    const newErrors = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (cnpj.replace(/\D/g, '').length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }
    if (!endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!responsavel.trim()) newErrors.responsavel = 'Responsável é obrigatório';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'E-mail inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSalvar() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const data = {
      nome: nome.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim(),
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      responsavel: responsavel.trim(),
      crmv: crmv.trim() || null,
      tipo,
    };

    try {
      if (editingEst) {
        updateEstabelecimento(editingEst.id, data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: 'Estabelecimento atualizado', text2: data.nome });
      } else {
        const newEst = { id: generateId(), ...data };
        addEstabelecimento(newEst);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: 'Estabelecimento cadastrado!', text2: data.nome });
      }
      setModalVisible(false);
      resetForm();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Erro', text2: e.message });
    }
  }

  function handleExcluir(est) {
    Alert.alert(
      'Excluir Estabelecimento',
      `Deseja excluir "${est.nome}"? Todas as licenças vinculadas serão removidas. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteEstabelecimento(est.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({ type: 'info', text1: 'Estabelecimento removido', text2: est.nome });
          },
        },
      ]
    );
  }

  function handleSelecionar(est) {
    Haptics.selectionAsync();
    setEstabelecimentoAtual(est);
    loadLicencas(est.id);
    navigation.navigate('Tabs');
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Estabelecimentos</Text>
        <Text style={styles.headerSubtitle}>
          {estabelecimentos.length === 0
            ? 'Cadastre seu primeiro estabelecimento'
            : `${estabelecimentos.length} estabelecimento${estabelecimentos.length !== 1 ? 's' : ''} cadastrado${estabelecimentos.length !== 1 ? 's' : ''}`}
        </Text>
      </LinearGradient>

      {/* Lista */}
      {estabelecimentos.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="hospital-building" size={52} color={Colors.textDisabled} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum estabelecimento</Text>
          <Text style={styles.emptySubtitle}>
            Cadastre seu estabelecimento para começar a gerenciar as licenças.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => openModal()} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyBtnGradient}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.emptyBtnText}>Cadastrar Estabelecimento</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={estabelecimentos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EstabelecimentoCard
              est={item}
              onPress={() => handleSelecionar(item)}
              onEdit={() => openModal(item)}
              onDelete={() => handleExcluir(item)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {estabelecimentos.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => openModal()}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Modal de cadastro / edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={modalStyles.container}>
            {/* Header do modal */}
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={modalStyles.header}
            >
              <TouchableOpacity
                onPress={() => { setModalVisible(false); resetForm(); }}
                style={modalStyles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={modalStyles.headerTitle}>
                {editingEst ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
              </Text>
              <Text style={modalStyles.headerSubtitle}>Dados do estabelecimento</Text>
            </LinearGradient>

            <ScrollView
              style={modalStyles.scroll}
              contentContainerStyle={modalStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Tipo */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Tipo de Estabelecimento *</Text>
                <View style={modalStyles.tipoRow}>
                  {TIPOS.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={[modalStyles.tipoCard, tipo === t.key && modalStyles.tipoCardSelected]}
                      onPress={() => setTipo(t.key)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={t.icon}
                        size={26}
                        color={tipo === t.key ? Colors.primary : Colors.textSecondary}
                      />
                      <Text style={[modalStyles.tipoLabel, tipo === t.key && modalStyles.tipoLabelSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dados da empresa */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Dados da Empresa</Text>
                <FormField
                  label="Nome / Razão Social"
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Ex: Clínica Veterinária Pet Care"
                  icon="domain"
                  error={errors.nome}
                  required
                />
                <FormField
                  label="CNPJ"
                  value={cnpj}
                  onChangeText={(t) => setCnpj(formatCnpj(t))}
                  placeholder="00.000.000/0001-00"
                  icon="card-account-details-outline"
                  keyboardType="numeric"
                  error={errors.cnpj}
                  required
                  autoCapitalize="none"
                />
                <FormField
                  label="Endereço Completo"
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Rua, número, bairro, cidade"
                  icon="map-marker-outline"
                  error={errors.endereco}
                  required
                />
                <FormField
                  label="Telefone"
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="(00) 0000-0000"
                  icon="phone-outline"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                <FormField
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contato@estabelecimento.com"
                  icon="email-outline"
                  keyboardType="email-address"
                  error={errors.email}
                  autoCapitalize="none"
                />
              </View>

              {/* Responsável */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Responsável Técnico</Text>
                <FormField
                  label="Nome do Responsável"
                  value={responsavel}
                  onChangeText={setResponsavel}
                  placeholder="Dr(a). Nome Completo"
                  icon="account-outline"
                  error={errors.responsavel}
                  required
                />
                <FormField
                  label="CRMV (se aplicável)"
                  value={crmv}
                  onChangeText={setCrmv}
                  placeholder="CRMV-SP 00000"
                  icon="certificate-outline"
                  autoCapitalize="characters"
                />
              </View>

              {/* Botão salvar */}
              <TouchableOpacity style={modalStyles.submitBtn} onPress={handleSalvar} activeOpacity={0.85}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={modalStyles.submitGradient}
                >
                  <MaterialCommunityIcons name="content-save-outline" size={22} color="#fff" />
                  <Text style={modalStyles.submitText}>
                    {editingEst ? 'Salvar Alterações' : 'Cadastrar Estabelecimento'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingBottom: 24,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: '#fff' },
  headerSubtitle: { ...Typography.body2, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  list: { padding: Spacing.md, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: { width: 5 },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 3 },
  cardNome: { ...Typography.h4, color: Colors.textPrimary },
  cardCnpj: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  cardEndereco: { ...Typography.caption, color: Colors.textTertiary, flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardActionBtn: { padding: 4 },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary, textAlign: 'center' },
  emptySubtitle: { ...Typography.body2, color: Colors.textTertiary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyBtnText: { ...Typography.button, color: '#fff', fontSize: 16 },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...Shadows.lg,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  closeBtn: { marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  headerTitle: { ...Typography.h2, color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { ...Typography.body2, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  tipoRow: { flexDirection: 'row', gap: Spacing.sm },
  tipoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  tipoCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.successBg,
    ...Shadows.sm,
  },
  tipoLabel: { ...Typography.button, color: Colors.textSecondary },
  tipoLabelSelected: { color: Colors.primary },
  submitBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: Spacing.sm,
  },
  submitText: { ...Typography.button, color: '#fff', fontSize: 17, fontWeight: '700' },
});

const fieldStyles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  required: { color: Colors.error },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FAFAFF',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  inputRowError: { borderColor: Colors.error, backgroundColor: '#FFF5F5' },
  input: {
    flex: 1,
    ...Typography.body1,
    color: Colors.textPrimary,
    paddingVertical: 0,
    fontSize: 16,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 6,
    fontWeight: '500',
  },
});
