import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useLicencasStore } from '../store/licencasStore';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { agendarNotificacaoVencimento } from '../utils/notifications';

const TIPOS = [
  { key: 'veterinaria', label: 'Veterinária', icon: 'paw' },
  { key: 'sanitaria', label: 'Sanitária', icon: 'medical-bag' },
];

export function EditarLicencaScreen({ route, navigation }) {
  const { licencaId } = route.params;
  const { getLicencaById, updateLicenca } = useLicencasStore();
  const licenca = getLicencaById(licencaId);

  const [nome, setNome] = useState(licenca?.nome || '');
  const [cnpj, setCnpj] = useState(licenca?.cnpj || '');
  const [endereco, setEndereco] = useState(licenca?.endereco || '');
  const [telefone, setTelefone] = useState(licenca?.telefone === '—' ? '' : (licenca?.telefone || ''));
  const [email, setEmail] = useState(licenca?.email === '—' ? '' : (licenca?.email || ''));
  const [responsavel, setResponsavel] = useState(licenca?.responsavel || '');
  const [crmv, setCrmv] = useState(licenca?.crmv || '');
  const [tipo, setTipo] = useState(licenca?.tipo || 'veterinaria');
  const [dataVencimento, setDataVencimento] = useState(licenca?.dataVencimento || '');
  const [status, setStatus] = useState(licenca?.status || 'pendente');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [anexoUri, setAnexoUri] = useState(licenca?.anexoUri || null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

  if (!licenca) {
    return (
      <View style={styles.container}>
        <Text>Licença não encontrada</Text>
      </View>
    );
  }
  
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDataVencimento(`${year}-${month}-${day}`);
    }
  };

  const abrirCamera = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da câmera para escanear a licença.');
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const tirarFoto = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.8 });
        const filename = photo.uri.split('/').pop();
        const newPath = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({
          from: photo.uri,
          to: newPath
        });
        setAnexoUri(newPath);
        setIsCameraOpen(false);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível capturar a foto.');
      }
    }
  };

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

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (telefone && telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone muito curto';
    }

    if (!dataVencimento.trim()) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) {
      newErrors.dataVencimento = 'Use o formato AAAA-MM-DD';
    }

    if (tipo === 'veterinaria' && (!crmv || !crmv.trim())) newErrors.crmv = 'CRMV é obrigatório para licenças veterinárias';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Atenção',
        text2: 'Preencha todos os campos obrigatórios corretamente.',
      });
      return false;
    }
    return true;
  }

  function handleSalvar() {
    if (!validate()) return;

    try {
      const updates = {
        nome,
        cnpj,
        endereco,
        telefone: telefone || '—',
        email: email || '—',
        responsavel,
        crmv: tipo === 'veterinaria' ? crmv : undefined,
        tipo,
        status,
        dataVencimento,
        anexoUri,
      };
    
      updateLicenca(licencaId, updates);
      agendarNotificacaoVencimento({ ...licenca, ...updates });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Licença Atualizada',
        text2: `A licença de "${nome}" foi atualizada com sucesso.`,
      });
      navigation.goBack();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao Atualizar',
        text2: error.message,
      });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar / Renovar</Text>
            <Text style={styles.headerSubtitle}>Atualize os dados e a validade da licença</Text>
          </LinearGradient>

          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tipo selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Licença *</Text>
              <View style={styles.tipoRow}>
                {TIPOS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tipoCard, tipo === t.key && styles.tipoCardSelected]}
                    onPress={() => setTipo(t.key)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={t.icon}
                      size={26}
                      color={tipo === t.key ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[styles.tipoLabel, tipo === t.key && styles.tipoLabelSelected]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status selector (Renovar) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.tipoRow}>
                <TouchableOpacity
                  style={[styles.tipoCard, status === 'pendente' && styles.statusPendenteSelected]}
                  onPress={() => setStatus('pendente')}
                >
                  <Text style={[styles.tipoLabel, status === 'pendente' && { color: Colors.warning }]}>Pendente (Renovação)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tipoCard, status === 'ativa' && styles.statusAtivaSelected]}
                  onPress={() => setStatus('ativa')}
                >
                  <Text style={[styles.tipoLabel, status === 'ativa' && { color: Colors.success }]}>Ativa</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Establishment info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados do Estabelecimento</Text>
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
                onChangeText={setCnpj}
                placeholder="00.000.000/0001-00"
                icon="card-account-details-outline"
                keyboardType="numeric"
                error={errors.cnpj}
                required
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
              />
              <FormField
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="contato@estabelecimento.com"
                icon="email-outline"
                keyboardType="email-address"
              />
            </View>

            {/* Responsible */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Responsável Técnico</Text>
              <FormField
                label="Nome do Responsável"
                value={responsavel}
                onChangeText={setResponsavel}
                placeholder="Dr(a). Nome Completo"
                icon="account-outline"
                error={errors.responsavel}
                required
              />
              {tipo === 'veterinaria' && (
                <FormField
                  label="CRMV"
                  value={crmv}
                  onChangeText={setCrmv}
                  placeholder="CRMV-SP 00000"
                  icon="certificate-outline"
                  error={errors.crmv}
                  required
                />
              )}
            </View>

            {/* Validity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nova Validade</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <FormField
                    label="Data de Vencimento"
                    value={dataVencimento}
                    placeholder="Selecione a data..."
                    icon="calendar-outline"
                    error={errors.dataVencimento}
                    required
                  />
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dataVencimento ? new Date(dataVencimento + 'T12:00:00Z') : new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
            </View>

            {/* Anexo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Novo Documento (Opcional)</Text>
              {anexoUri ? (
                <View style={styles.anexoContainer}>
                  <Image source={{ uri: anexoUri }} style={styles.anexoPreview} />
                  <TouchableOpacity style={styles.anexoRemoveBtn} onPress={() => setAnexoUri(null)}>
                    <MaterialCommunityIcons name="delete" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.anexoBtn} onPress={abrirCamera} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="camera-plus" size={28} color={Colors.primary} />
                  <Text style={styles.anexoBtnText}>Escanear Documento</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSalvar} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <MaterialCommunityIcons name="content-save-edit-outline" size={24} color="#fff" />
                <Text style={styles.submitText}>Salvar Alterações</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
      </View>
      <Modal visible={isCameraOpen} animationType="slide" onRequestClose={() => setIsCameraOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView 
            style={{ flex: 1 }} 
            facing="back"
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setIsCameraOpen(false)}>
                <MaterialCommunityIcons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraCaptureBtn} onPress={tirarFoto}>
                <View style={styles.cameraCaptureBtnInner} />
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>
          </CameraView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  error,
  required,
}) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>
        {label} {required && <Text style={fieldStyles.required}>*</Text>}
      </Text>
      <View style={[
        fieldStyles.inputRow,
        isFocused && fieldStyles.inputRowFocused,
        error && fieldStyles.inputRowError
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
          autoCapitalize="words"
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

const fieldStyles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  label: { 
    ...Typography.label, 
    color: Colors.textSecondary, 
    marginBottom: 8,
    fontWeight: '600'
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
  inputRowError: { 
    borderColor: Colors.error, 
    backgroundColor: '#FFF5F5' 
  },
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  backBtn: { marginBottom: Spacing.sm },
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statusPendenteSelected: {
    borderColor: Colors.warning, 
    backgroundColor: Colors.warning + '10',
  },
  statusAtivaSelected: {
    borderColor: Colors.success, 
    backgroundColor: Colors.successBg,
  },
  tipoLabel: { ...Typography.button, color: Colors.textSecondary },
  tipoLabelSelected: { color: Colors.primary },
  
  submitBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginTop: Spacing.md,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: Spacing.sm,
  },
  submitText: { ...Typography.button, color: '#fff', fontSize: 18, fontWeight: '700' },
  anexoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
  },
  anexoBtnText: { ...Typography.button, color: Colors.primary },
  anexoContainer: { position: 'relative', width: '100%', height: 200, borderRadius: BorderRadius.md, overflow: 'hidden' },
  anexoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  anexoRemoveBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 2 },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 30,
    paddingBottom: 50,
  },
  cameraCloseBtn: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraCaptureBtn: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraCaptureBtnInner: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff',
  },
});
