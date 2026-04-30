import React, { useState } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLicencasStore } from '../store/licencasStore';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/colors';
import { generateId, generateCodigo } from '../utils/formatters';

const TIPOS = [
  { key: 'veterinaria', label: 'Veterinária', icon: 'paw' },
  { key: 'sanitaria', label: 'Sanitária', icon: 'medical-bag' },
];

export function CadastroScreen({ navigation }) {
  const { addLicenca, licencas } = useLicencasStore();

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [crmv, setCrmv] = useState('');
  const [tipo, setTipo] = useState('veterinaria');
  const [dataVencimento, setDataVencimento] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDataVencimento(`${year}-${month}-${day}`);
    }
  };
  
  const [endereco, setEndereco] = useState('');

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
      console.log('Erros de validação:', newErrors);
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios corretamente.');
      return false;
    }
    return true;
  }

  function handleSalvar() {
    if (!validate()) return;

    try {
      const nextCode = licencas.length + 1;
      
      const novaLicenca = {
        id: generateId(),
        codigo: generateCodigo(nextCode),
        nome,
        cnpj,
        endereco,
        telefone: telefone || '—',
        email: email || '—',
        responsavel,
        crmv: tipo === 'veterinaria' ? crmv : undefined,
        tipo,
        status: 'pendente',
        dataEmissao: new Date().toISOString().split('T')[0],
        dataVencimento,
        inspecoes: [],
      };
    
      addLicenca(novaLicenca);

      Alert.alert(
        '✅ Licença Cadastrada',
        `"${nome}" foi cadastrada com o código ${novaLicenca.codigo}.`,
        [
          {
            text: 'Ver Licenças',
            onPress: () => navigation.navigate('Licencas'),
          },
          { text: 'Nova Licença', onPress: resetForm },
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar licença:', error);
      Alert.alert('Erro', `Não foi possível salvar a licença: ${error.message}`);
    }
  }

  function resetForm() {
    setNome('');
    setCnpj('');
    setEndereco('');
    setTelefone('');
    setEmail('');
    setResponsavel('');
    setCrmv('');
    setResponsavel('');
    setCrmv('');
    setDataVencimento('');
    setErrors({});
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
            <Text style={styles.headerTitle}>Nova Licença</Text>
            <Text style={styles.headerSubtitle}>Preencha os dados do estabelecimento</Text>
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
              <Text style={styles.sectionTitle}>Validade</Text>
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
                  minimumDate={new Date()}
                />
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
                <MaterialCommunityIcons name="content-save-outline" size={24} color="#fff" />
                <Text style={styles.submitText}>Cadastrar Licença</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
      </View>
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
});