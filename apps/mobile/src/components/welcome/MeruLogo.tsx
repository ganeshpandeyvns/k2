// ============================================================================
// MeruLogo - Bold, Elegant Brand Mark
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { MeruTheme } from '../../theme/meru';

interface MeruLogoProps {
  size?: 'small' | 'medium' | 'large';
  showPoweredBy?: boolean;
  animated?: boolean;
}

const SIZES = {
  small: { logo: 48, tagline: 11, spacing: 4 },
  medium: { logo: 64, tagline: 13, spacing: 6 },
  large: { logo: 72, tagline: 14, spacing: 8 },
};

export const MeruLogo: React.FC<MeruLogoProps> = ({
  size = 'large',
  showPoweredBy = true,
  animated = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(animated ? 0.8 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const poweredByOpacity = useRef(new Animated.Value(animated ? 0 : 1)).current;

  const dimensions = SIZES[size];

  useEffect(() => {
    if (animated) {
      Animated.sequence([
        // Logo entrance
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Powered by fade in
        Animated.timing(poweredByOpacity, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.logo,
          {
            fontSize: dimensions.logo,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        MERU
      </Animated.Text>

      {showPoweredBy && (
        <Animated.Text
          style={[
            styles.poweredBy,
            {
              fontSize: dimensions.tagline,
              marginTop: dimensions.spacing,
              opacity: poweredByOpacity,
            },
          ]}
        >
          Powered by tZero
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    fontWeight: '800',
    color: MeruTheme.colors.accent.primary,
    letterSpacing: -2,
  },
  poweredBy: {
    fontWeight: '500',
    color: MeruTheme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
});
