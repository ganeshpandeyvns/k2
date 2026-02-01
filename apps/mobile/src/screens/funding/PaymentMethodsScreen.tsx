// ============================================================================
// Payment Methods Screen - Manage Bank Accounts
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';
import { PaymentMethodCard } from '../../components/funding/PaymentMethodCard';
import { useFundingStore, PaymentMethod } from '../../store/fundingStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { paymentMethods, removePaymentMethod, setDefaultMethod } = useFundingStore();

  const handleSelectMethod = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefaultMethod(method.id);
    navigation.goBack();
  };

  const handleRemoveMethod = (method: PaymentMethod) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${method.name} (••••${method.lastFour})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            removePaymentMethod(method.id);
          },
        },
      ]
    );
  };

  const handleAddBank = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddBank' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Bank Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bank Accounts</Text>

          {paymentMethods.filter((m) => m.type === 'bank').length > 0 ? (
            <View style={styles.methodsList}>
              {paymentMethods
                .filter((m) => m.type === 'bank')
                .map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    onLongPress={() => handleRemoveMethod(method)}
                    delayLongPress={500}
                  >
                    <PaymentMethodCard
                      method={method}
                      selected={method.isDefault}
                      onPress={() => handleSelectMethod(method)}
                    />
                  </TouchableOpacity>
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏦</Text>
              <Text style={styles.emptyTitle}>No bank accounts linked</Text>
              <Text style={styles.emptySubtitle}>
                Add a bank account to deposit and withdraw funds
              </Text>
            </View>
          )}

          {/* Add Bank Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddBank}
            activeOpacity={0.7}
          >
            <View style={styles.addButtonIcon}>
              <Text style={styles.addButtonIconText}>+</Text>
            </View>
            <Text style={styles.addButtonText}>Add Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* Cards Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Debit Cards</Text>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonIcon}>💳</Text>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Tips</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>
              Bank transfers have no fees
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>
              Deposits are instant, withdrawals take 1-3 days
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>
              Long press to remove a payment method
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: MeruTheme.colors.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: MeruTheme.colors.accent.primary,
    borderStyle: 'dashed',
  },
  addButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 180, 41, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIconText: {
    fontSize: 24,
    color: MeruTheme.colors.accent.primary,
    fontWeight: '300',
  },
  addButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
  comingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    padding: 24,
    gap: 8,
  },
  comingSoonIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  comingSoonText: {
    fontSize: 15,
    color: MeruTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 14,
    color: '#22c55e',
    marginRight: 10,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    lineHeight: 20,
  },
});
