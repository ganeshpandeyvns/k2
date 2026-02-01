// ============================================================================
// WelcomeScreen - Premium Million-Dollar Landing Experience
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Pressable,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useBiometrics } from '../hooks/useBiometrics';
import { useAuthStore } from '../store/authStore';
import { DemoUser } from '../theme/meru';
import type { RootStackParamList } from '../navigation/RootNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type WelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

// Mountain Peak Logo Component
const MeruMountainLogo = ({ size = 80 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffd700" />
        <Stop offset="50%" stopColor="#f0b429" />
        <Stop offset="100%" stopColor="#d4a028" />
      </SvgGradient>
      <SvgGradient id="peakGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#f0b429" />
        <Stop offset="100%" stopColor="#ffeaa7" />
      </SvgGradient>
    </Defs>
    {/* Mountain Peak */}
    <Path
      d="M50 10 L85 75 L70 75 L50 45 L30 75 L15 75 Z"
      fill="url(#goldGrad)"
    />
    {/* Snow cap / highlight */}
    <Path
      d="M50 10 L60 30 L50 25 L40 30 Z"
      fill="url(#peakGrad)"
      opacity={0.9}
    />
    {/* Reflection line */}
    <Path
      d="M35 55 L50 35 L65 55"
      stroke="#ffeaa7"
      strokeWidth="2"
      fill="none"
      opacity={0.5}
    />
  </Svg>
);

// Face ID Icon Component
const FaceIdIcon = ({ size = 48, color = '#f0b429' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Face outline corners */}
    <Path d="M8 20V12C8 9.79 9.79 8 12 8H20" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <Path d="M44 8H52C54.21 8 56 9.79 56 12V20" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <Path d="M56 44V52C56 54.21 54.21 56 52 56H44" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <Path d="M20 56H12C9.79 56 8 54.21 8 52V44" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Eyes */}
    <Circle cx="24" cy="26" r="3" fill={color} />
    <Circle cx="40" cy="26" r="3" fill={color} />
    {/* Nose */}
    <Path d="M32 28V38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    {/* Smile */}
    <Path d="M24 44C24 44 28 48 32 48C36 48 40 44 40 44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// Floating Particle Component
const FloatingParticle = ({ delay, duration, startX, size }: { delay: number; duration: number; startX: number; size: number }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT + 50);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -50,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.6,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const { isAvailable, biometricType, authenticate, getBiometricLabel } = useBiometrics();
  const login = useAuthStore((state) => state.login);

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Content entrance
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlide, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBiometricAuth = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isAvailable) {
      const success = await authenticate(`Sign in to Meru with ${getBiometricLabel()}`);
      if (success) {
        login(
          { id: DemoUser.id, email: DemoUser.email, displayName: DemoUser.name },
          'biometric-access-token',
          'biometric-refresh-token'
        );
      }
    } else {
      // Demo: just login
      login(
        { id: DemoUser.id, email: DemoUser.email, displayName: DemoUser.name },
        'demo-token',
        'demo-refresh'
      );
    }
  };

  const handleCreateAccount = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  // Generate particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 800,
    duration: 8000 + Math.random() * 4000,
    startX: Math.random() * SCREEN_WIDTH,
    size: 3 + Math.random() * 4,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep Background */}
      <LinearGradient
        colors={['#030305', '#050507', '#0a0a0f', '#050507', '#030305']}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated Gold Glow */}
      <Animated.View style={[styles.glowContainer, { opacity: glowPulse }]}>
        <LinearGradient
          colors={['transparent', 'rgba(240, 180, 41, 0.08)', 'rgba(240, 180, 41, 0.15)', 'rgba(240, 180, 41, 0.08)', 'transparent']}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.glow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Secondary glow - top accent */}
      <View style={styles.topGlow}>
        <LinearGradient
          colors={['rgba(240, 180, 41, 0.1)', 'transparent']}
          style={styles.topGlowGradient}
        />
      </View>

      {/* Floating Particles */}
      {particles.map((p) => (
        <FloatingParticle key={p.id} {...p} />
      ))}

      <SafeAreaView style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Mountain Icon */}
          <View style={styles.iconContainer}>
            <MeruMountainLogo size={90} />
          </View>

          {/* Brand Name */}
          <Text style={styles.brandName}>MERU</Text>

          {/* Decorative line */}
          <View style={styles.decorativeLine}>
            <LinearGradient
              colors={['transparent', '#f0b429', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.lineGradient}
            />
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>Powered by tZero</Text>
        </Animated.View>

        {/* Action Section */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          {/* Face ID Button - Always show for premium look */}
          <Pressable
            style={({ pressed }) => [
              styles.faceIdButton,
              pressed && styles.faceIdButtonPressed,
            ]}
            onPress={handleBiometricAuth}
          >
            <View style={styles.faceIdGlow} />
            <FaceIdIcon size={52} color="#f0b429" />
            <Text style={styles.faceIdText}>
              {isAvailable ? `Continue with ${getBiometricLabel()}` : 'Continue with Face ID'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Buttons */}
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCreateAccount}
          >
            <LinearGradient
              colors={['#f0b429', '#e6a623', '#d4a028']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.createButtonText}>Create Account</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.signInButtonPressed,
            ]}
            onPress={handleSignIn}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Pressable>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030305',
  },
  glowContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    left: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
    height: SCREEN_HEIGHT * 0.5,
  },
  glow: {
    flex: 1,
    borderRadius: SCREEN_WIDTH,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  topGlowGradient: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#f0b429',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 56,
    fontWeight: '900',
    color: '#f0b429',
    letterSpacing: 8,
    textShadowColor: 'rgba(240, 180, 41, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  decorativeLine: {
    width: 120,
    height: 2,
    marginVertical: 16,
  },
  lineGradient: {
    flex: 1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionSection: {
    paddingBottom: 16,
  },
  faceIdButton: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(240, 180, 41, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(240, 180, 41, 0.2)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  faceIdButtonPressed: {
    backgroundColor: 'rgba(240, 180, 41, 0.15)',
  },
  faceIdGlow: {
    position: 'absolute',
    top: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
    borderRadius: 75,
  },
  faceIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  createButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#f0b429',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  signInButton: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 180, 41, 0.5)',
    backgroundColor: 'rgba(240, 180, 41, 0.05)',
  },
  signInButtonPressed: {
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
    transform: [{ scale: 0.98 }],
  },
  signInButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f0b429',
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
});
