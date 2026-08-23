import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEstabelecimentosStore } from '../store/estabelecimentosStore';
import { Colors, Spacing, Shadows, BorderRadius, Typography } from '../theme/colors';

export function EstablishmentPickerModal({ visible, onClose, onNavigateToManage }) {
  const { estabelecimentoAtual, setEstabelecimentoAtual } = useEstabelecimentosStore();

  const rawEstabelecimentos = useQuery(api.estabelecimentos.list) ?? [];
  const estabelecimentos = React.useMemo(
    () => rawEstabelecimentos.map((e) => ({ ...e, id: e._id })),
    [rawEstabelecimentos]
  );

  function handleSelect(est) {
    Haptics.selectionAsync();
    setEstabelecimentoAtual(est);
    onClose();
  }

  function handleManage() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (onNavigateToManage) {
      onNavigateToManage();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Swipe handle indicator */}
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.title}>Selecionar Estabelecimento</Text>
                  <Text style={styles.subtitle}>
                    {estabelecimentos.length} {estabelecimentos.length === 1 ? 'cadastrado' : 'cadastrados'}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* List of Establishments */}
              <FlatList
                data={estabelecimentos}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isSelected = estabelecimentoAtual?.id === item.id;
                  const iconName = item.tipo === 'veterinaria' ? 'paw' : 'medical-bag';
                  const iconColor = item.tipo === 'veterinaria' ? Colors.veterinaria : Colors.sanitaria;
                  const iconBg = item.tipo === 'veterinaria' ? Colors.veterinariaBg : Colors.sanitariaBg;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.estItem,
                        isSelected && styles.estItemSelected,
                        Shadows.sm,
                      ]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                        <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                      </View>

                      <View style={styles.estInfo}>
                        <View style={styles.estTitleRow}>
                          <Text style={styles.estNome} numberOfLines={1}>
                            {item.nome}
                          </Text>
                          {isSelected && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>Ativo</Text>
                            </View>
                          )}
                        </View>
                        {item.cnpj ? (
                          <Text style={styles.estCnpj}>{item.cnpj}</Text>
                        ) : null}
                        {item.endereco ? (
                          <Text style={styles.estEndereco} numberOfLines={1}>
                            {item.endereco}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.checkWrap}>
                        {isSelected ? (
                          <View style={styles.radioSelected}>
                            <MaterialCommunityIcons name="check-bold" size={14} color="#fff" />
                          </View>
                        ) : (
                          <View style={styles.radioUnselected} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Footer Button: Manage Establishments */}
              <TouchableOpacity
                style={styles.manageBtn}
                onPress={handleManage}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="hospital-building" size={20} color={Colors.primary} />
                <Text style={styles.manageBtnText}>Gerenciar todos os estabelecimentos</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    maxHeight: '75%',
    ...Shadows.lg,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  estItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  estItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0A',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  estInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  estTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  estNome: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  activeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  estCnpj: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  estEndereco: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  checkWrap: {
    marginLeft: Spacing.xs,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '12',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  manageBtnText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary,
  },
});
