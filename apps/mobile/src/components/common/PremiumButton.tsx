// ============================================================================
// PremiumButton - Luxury Button Component
// ============================================================================

import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'ghost';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZES = {
  small: { height: 44, fontSize: 15, paddingHorizontal: 20, borderRadius: 12 },
  medium: { height: 52, fontSize: 16, paddingHorizontal: 24, borderRadius: 14 },
  large: { height: 56, fontSize: 17, paddingHorizontal: 28, borderRadius: 16 },
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  size = 'large',
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dimensions = SIZES[size];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'filled' ? '#FFFFFF' : MeruTheme.colors.accent.primary}
          size="small"
        />
      );
    }

    return (
      <View style={styles.contentRow}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        <Text
          style={[
            styles.text,
            { fontSize: dimensions.fontSize },
            variant === 'filled' && styles.textFilled,
            variant === 'outlined' && styles.textOutlined,
            variant === 'ghost' && styles.textGhost,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    );
  };

  const buttonStyle: ViewStyle = {
    height: dimensions.height,
    paddingHorizontal: dimensions.paddingHorizontal,
    borderRadius: dimensions.borderRadius,
  };

  if (variant === 'filled') {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || loading}
        >
          <LinearGradient
            colors={
              disabled
                ? ['#444444', '#333333']
                : [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, buttonStyle]}
          >
            {renderContent()}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.button,
          buttonStyle,
          variant === 'outlined' && styles.buttonOutlined,
          variant === 'ghost' && styles.buttonGhost,
          disabled && styles.buttonDisabled,
        ]}
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: MeruTheme.colors.accent.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    borderColor: '#444444',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textFilled: {
    color: '#FFFFFF',
  },
  textOutlined: {
    color: MeruTheme.colors.accent.primary,
  },
  textGhost: {
    color: MeruTheme.colors.text.secondary,
  },
  textDisabled: {
    color: '#666666',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
