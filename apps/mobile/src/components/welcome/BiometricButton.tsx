// ============================================================================
// BiometricButton - Face ID / Touch ID Authentication Button
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import Svg, { Path, G, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';

interface BiometricButtonProps {
  onPress: () => void;
  biometricType: 'faceId' | 'touchId' | 'fingerprint' | 'none';
  loading?: boolean;
  disabled?: boolean;
  animated?: boolean;
}

// Face ID Icon SVG
const FaceIdIcon = ({ size = 64, color = MeruTheme.colors.accent.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Face outline corners */}
    <Path
      d="M8 20V12C8 9.79086 9.79086 8 12 8H20"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Path
      d="M44 8H52C54.2091 8 56 9.79086 56 12V20"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Path
      d="M56 44V52C56 54.2091 54.2091 56 52 56H44"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Path
      d="M20 56H12C9.79086 56 8 54.2091 8 52V44"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Eyes */}
    <Circle cx="24" cy="26" r="2.5" fill={color} />
    <Circle cx="40" cy="26" r="2.5" fill={color} />
    {/* Nose */}
    <Path
      d="M32 28V36"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Mouth */}
    <Path
      d="M24 42C24 42 28 46 32 46C36 46 40 42 40 42"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Fingerprint Icon SVG
const FingerprintIcon = ({ size = 64, color = MeruTheme.colors.accent.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Path
      d="M32 8C20.954 8 12 16.954 12 28V36C12 47.046 20.954 56 32 56"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.3}
    />
    <Path
      d="M32 14C24.268 14 18 20.268 18 28V36C18 43.732 24.268 50 32 50"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.5}
    />
    <Path
      d="M32 20C27.582 20 24 23.582 24 28V36C24 40.418 27.582 44 32 44"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.7}
    />
    <Path
      d="M32 26C29.791 26 28 27.791 28 30V34C28 36.209 29.791 38 32 38C34.209 38 36 36.209 36 34V30C36 27.791 34.209 26 32 26Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Path
      d="M52 28C52 16.954 43.046 8 32 8"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.3}
    />
    <Path
      d="M46 28C46 20.268 39.732 14 32 14"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.5}
    />
    <Path
      d="M40 28C40 23.582 36.418 20 32 20"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.7}
    />
  </Svg>
);

export const BiometricButton: React.FC<BiometricButtonProps> = ({
  onPress,
  biometricType,
  loading = false,
  disabled = false,
  animated = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 50 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getLabel = () => {
    if (loading) return 'Authenticating...';
    switch (biometricType) {
      case 'faceId':
        return 'Continue with Face ID';
      case 'touchId':
        return 'Continue with Touch ID';
      case 'fingerprint':
        return 'Continue with Fingerprint';
      default:
        return 'Continue with Biometrics';
    }
  };

  const renderIcon = () => {
    const iconColor = disabled
      ? MeruTheme.colors.text.tertiary
      : MeruTheme.colors.accent.primary;

    if (biometricType === 'faceId') {
      return <FaceIdIcon size={64} color={iconColor} />;
    }
    return <FingerprintIcon size={64} color={iconColor} />;
  };

  if (biometricType === 'none') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <View style={styles.iconContainer}>{renderIcon()}</View>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {getLabel()}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: '25%',
    right: '25%',
    height: 120,
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 60,
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }],
  },
  button: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 24,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    letterSpacing: 0.3,
  },
  labelDisabled: {
    color: MeruTheme.colors.text.tertiary,
  },
});
