// ============================================================================
// LoginScreen - Meru Premium Sign In Experience
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { MeruLogo } from '../components/welcome/MeruLogo';
import { PremiumButton } from '../components/common/PremiumButton';
import { useBiometrics } from '../hooks/useBiometrics';
import { useAuthStore } from '../store/authStore';
import { MeruTheme, DemoUser } from '../theme/meru';
import type { RootStackParamList } from '../navigation/RootNavigator';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const login = useAuthStore((state) => state.login);
  const { isAvailable, biometricType, authenticate, getBiometricLabel } = useBiometrics();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate login - in production, call auth API
    setTimeout(() => {
      login(
        { id: 'user-001', email, displayName: email.split('@')[0] },
        'mock-access-token',
        'mock-refresh-token'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(false);
    }, 1000);
  };

  const handleBiometricLogin = async () => {
    const success = await authenticate(`Sign in to Meru with ${getBiometricLabel()}`);
    if (success) {
      login(
        { id: DemoUser.id, email: DemoUser.email, displayName: DemoUser.name },
        'biometric-access-token',
        'biometric-refresh-token'
      );
    }
  };

  const handleDevLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    login(
      { id: DemoUser.id, email: DemoUser.email, displayName: DemoUser.name },
      'dev-token',
      'dev-refresh'
    );
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient
        colors={[
          MeruTheme.colors.background.primary,
          MeruTheme.colors.background.secondary,
          MeruTheme.colors.background.primary,
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo / Branding */}
            <View style={styles.branding}>
              <MeruLogo size="medium" showPoweredBy={false} animated={false} />
              <Text style={styles.welcomeText}>Welcome back</Text>
            </View>

            {/* Biometric Quick Login */}
            {isAvailable && (
              <Pressable style={styles.biometricRow} onPress={handleBiometricLogin}>
                <Text style={styles.biometricIcon}>
                  {biometricType === 'faceId' ? '👤' : '👆'}
                </Text>
                <Text style={styles.biometricText}>
                  Sign in with {getBiometricLabel()}
                </Text>
              </Pressable>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'email' && styles.inputContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'password' && styles.inputContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              <PremiumButton
                title={loading ? 'Signing in...' : 'Sign In'}
                onPress={handleLogin}
                variant="filled"
                size="large"
                loading={loading}
                disabled={loading}
                style={styles.signInButton}
              />
            </View>

            {/* Dev Login */}
            <PremiumButton
              title="Quick Demo Login"
              onPress={handleDevLogin}
              variant="ghost"
              size="medium"
              style={styles.devButton}
            />
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: MeruTheme.colors.accent.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  branding: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: MeruTheme.colors.text.secondary,
    marginTop: 16,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
    marginBottom: 24,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: MeruTheme.colors.border.subtle,
  },
  dividerText: {
    fontSize: 13,
    color: MeruTheme.colors.text.tertiary,
    marginHorizontal: 16,
  },
  form: {
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
    marginBottom: 16,
  },
  inputContainerFocused: {
    borderColor: MeruTheme.colors.accent.primary,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: MeruTheme.colors.accent.primary,
  },
  signInButton: {
    marginTop: 8,
  },
  devButton: {
    marginTop: 16,
  },
  footer: {
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: MeruTheme.colors.accent.primary,
  },
});
