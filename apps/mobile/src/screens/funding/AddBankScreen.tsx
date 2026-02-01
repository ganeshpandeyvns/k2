// ============================================================================
// Add Bank Screen - Plaid-style Bank Linking
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { BankGrid } from '../../components/funding/BankGrid';
import { useFundingStore } from '../../store/fundingStore';
import { generateLastFour, type MockBank } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AddBankScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addPaymentMethod } = useFundingStore();

  const [selectedBank, setSelectedBank] = useState<MockBank | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));

  const handleSelectBank = (bank: MockBank) => {
    setSelectedBank(bank);
    setShowLoginModal(true);
  };

  const handleConnect = async () => {
    if (!selectedBank) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConnecting(true);

    // Simulate bank connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add the payment method
    addPaymentMethod({
      id: `bank_${Date.now()}`,
      type: 'bank',
      name: selectedBank.name,
      lastFour: generateLastFour(),
      bankId: selectedBank.id,
      isDefault: false,
      status: 'verified',
      accountType: 'checking',
    });

    setIsConnecting(false);
    setConnectionSuccess(true);

    // Animate success
    Animated.spring(successAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Close after delay
    setTimeout(() => {
      setShowLoginModal(false);
      navigation.goBack();
    }, 1500);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setEmail('');
    setPassword('');
    setConnectionSuccess(false);
    successAnim.setValue(0);
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
        <Text style={styles.headerTitle}>Link Bank Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Subheader */}
      <View style={styles.subheader}>
        <Text style={styles.subheaderText}>
          Select your bank to securely link your account
        </Text>
      </View>

      {/* Bank Grid */}
      <View style={styles.content}>
        <BankGrid onSelectBank={handleSelectBank} />
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Your credentials are encrypted and never stored
        </Text>
      </View>

      {/* Bank Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Connect to {selectedBank?.name}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {connectionSuccess ? (
            // Success State
            <View style={styles.successContainer}>
              <Animated.View
                style={[
                  styles.successCircle,
                  {
                    transform: [{ scale: successAnim }],
                    opacity: successAnim,
                  },
                ]}
              >
                <Text style={styles.successIcon}>✓</Text>
              </Animated.View>
              <Text style={styles.successTitle}>Account Linked!</Text>
              <Text style={styles.successSubtitle}>
                Your {selectedBank?.name} account is now connected
              </Text>
            </View>
          ) : (
            // Login Form
            <View style={styles.modalContent}>
              {/* Bank Icon */}
              <View
                style={[
                  styles.bankIconLarge,
                  { backgroundColor: selectedBank?.color },
                ]}
              >
                <Text style={styles.bankIconLargeText}>
                  {selectedBank?.name.charAt(0)}
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <Text style={styles.inputLabel}>Email or Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your banking email"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                {/* Demo Notice */}
                <View style={styles.demoNotice}>
                  <Text style={styles.demoNoticeText}>
                    Demo Mode: Enter any credentials to continue
                  </Text>
                </View>
              </View>

              {/* Connect Button */}
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  (!email || !password || isConnecting) && styles.connectButtonDisabled,
                ]}
                onPress={handleConnect}
                disabled={!email || !password || isConnecting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    email && password && !isConnecting
                      ? [selectedBank?.color || '#f0b429', selectedBank?.color || '#d4a028']
                      : ['#3a3a3a', '#2a2a2a']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.connectButtonGradient}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.connectButtonText}>Connect Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
  subheader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subheaderText: {
    fontSize: 15,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 13,
    color: MeruTheme.colors.text.tertiary,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  bankIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  bankIconLargeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: -8,
  },
  input: {
    height: 52,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
  },
  demoNotice: {
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  demoNoticeText: {
    fontSize: 13,
    color: MeruTheme.colors.accent.primary,
    textAlign: 'center',
  },
  connectButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  connectButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },

  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: '#fff',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
  },
});
