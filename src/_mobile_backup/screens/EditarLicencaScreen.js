import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
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
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { agendarNotificacaoVencimento } from '../utils/notifications';
import { TIPOS_LICENCA, getTipoLicencaConfig } from '../utils/formatters';


export function EditarLicencaScreen({ route, navigation }) {
  const { licencaId } = route.params;
  const licenca = useQuery(api.licencas.getById, { id: licencaId });
  const updateLicenca = useMutation(api.licencas.update);
  const estabelecimentoAtual = useEstabelecimentosStore((s) => s.estabelecimentoAtual);

  const [tipoLicenca, setTipoLicenca] = useState(licenca?.tipoLicenca || '');
  const [dataVencimento, setDataVencimento] = useState(licenca?.dataVencimento || '');
  const [status, setStatus] = useState(licenca?.status || 'pendente');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTipoModal, setShowTipoModal] = useState(false);
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
    if (!tipoLicenca) newErrors.tipoLicenca = 'Selecione o tipo de licença';
    if (!dataVencimento.trim()) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) {
      newErrors.dataVencimento = 'Use o formato AAAA-MM-DD';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Atenção', text2: 'Preencha todos os campos obrigatórios.' });
      return false;
    }
    return true;
  }

  function handleSalvar() {
    if (!validate()) return;

    try {
      const updates = {
        id: licencaId,
        tipoLicenca,
        status,
        dataVencimento,
        anexoUri: anexoUri || undefined,
      };
    
      updateLicenca(updates);
      agendarNotificacaoVencimento({ ...licenca, ...updates });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Licença Atualizada',
        text2: `A licença foi atualizada com sucesso.`,
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
            {estabelecimentoAtual && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>{estabelecimentoAtual.nome}</Text>
            )}
          </LinearGradient>

          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tipo de Licença */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Licença *</Text>
              <TouchableOpacity
                style={[styles.tipoSelector, errors.tipoLicenca && styles.tipoSelectorError]}
                onPress={() => setShowTipoModal(true)}
                activeOpacity={0.8}
              >
                {tipoLicenca ? (
                  <View style={styles.tipoSelectorContent}>
                    <MaterialCommunityIcons name={getTipoLicencaConfig(tipoLicenca).icon || 'file-document-outline'} size={22} color={Colors.primary} />
                    <Text style={styles.tipoSelectorText} numberOfLines={2}>{getTipoLicencaConfig(tipoLicenca).label}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} />
                  </View>
                ) : (
                  <View style={styles.tipoSelectorContent}>
                    <MaterialCommunityIcons name="file-document-outline" size={22} color={Colors.textDisabled} />
                    <Text style={styles.tipoSelectorPlaceholder}>Selecione o tipo de licença...</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textDisabled} />
                  </View>
                )}
              </TouchableOpacity>
              {errors.tipoLicenca && (
                <Text style={styles.errorText}><MaterialCommunityIcons name="alert-circle" size={14} /> {errors.tipoLicenca}</Text>
              )}
            </View>

            {/* Status selector */}
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
      {/* Modal tipo de licença */}
      <Modal visible={showTipoModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTipoModal(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: Colors.surface }}>
            <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>Selecione o Tipo</Text>
            <TouchableOpacity onPress={() => setShowTipoModal(false)}>
              <MaterialCommunityIcons name="close" size={26} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={TIPOS_LICENCA}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tipoItem, tipoLicenca === item.key && styles.tipoItemSelected]}
                onPress={() => { setTipoLicenca(item.key); setShowTipoModal(false); }}
                activeOpacity={0.75}
              >
                <View style={[styles.tipoItemIcon, tipoLicenca === item.key && styles.tipoItemIconSelected]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={tipoLicenca === item.key ? Colors.primary : Colors.textSecondary} />
                </View>
                <Text style={[styles.tipoItemLabel, tipoLicenca === item.key && styles.tipoItemLabelSelected]}>{item.label}</Text>
                {tipoLicenca === item.key && <MaterialCommunityIcons name="check-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
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
  tipoSelector: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipoSelectorError: { borderColor: Colors.error, backgroundColor: '#FFF5F5' },
  tipoSelectorContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tipoSelectorText: { flex: 1, ...Typography.body1, color: Colors.textPrimary, fontWeight: '600' },
  tipoSelectorPlaceholder: { flex: 1, ...Typography.body1, color: Colors.textDisabled },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: 6, fontWeight: '500' },
  tipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  tipoItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  tipoItemIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tipoItemIconSelected: { backgroundColor: Colors.primary + '18' },
  tipoItemLabel: { flex: 1, ...Typography.body2, color: Colors.textPrimary, fontWeight: '500', lineHeight: 20 },
  tipoItemLabelSelected: { color: Colors.primary, fontWeight: '700' },
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
