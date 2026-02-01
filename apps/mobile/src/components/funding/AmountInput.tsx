// ============================================================================
// Amount Input Component - Premium Number Pad
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';
import { quickAmounts, formatCurrency } from '../../utils/mockData';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  maxAmount?: number;
  currency?: string;
  showQuickAmounts?: boolean;
}

const numberPadKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  maxAmount,
  currency = 'USD',
  showQuickAmounts = true,
}) => {
  const [scaleAnims] = useState(() =>
    Array(12)
      .fill(0)
      .map(() => new Animated.Value(1))
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnims[index], {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (key === '⌫') {
        onChange(value.slice(0, -1));
        return;
      }

      // Prevent multiple decimals
      if (key === '.' && value.includes('.')) return;

      // Limit decimal places to 2
      const parts = value.split('.');
      if (parts[1] && parts[1].length >= 2 && key !== '.') return;

      // Prevent leading zeros (except for decimals)
      if (value === '0' && key !== '.') {
        onChange(key);
        return;
      }

      const newValue = value + key;

      // Check max amount
      if (maxAmount && parseFloat(newValue) > maxAmount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      onChange(newValue);
    },
    [value, onChange, maxAmount, scaleAnims]
  );

  const handleQuickAmount = useCallback(
    (amount: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onChange(amount.toString());
    },
    [onChange]
  );

  const displayValue = value || '0';
  const numericValue = parseFloat(displayValue) || 0;

  return (
    <View style={styles.container}>
      {/* Amount Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.currencySymbol}>$</Text>
        <Text
          style={[
            styles.amountText,
            displayValue.length > 7 && styles.amountTextSmall,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayValue}
        </Text>
      </View>

      {/* Quick Amount Pills */}
      {showQuickAmounts && (
        <View style={styles.quickAmountsContainer}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.quickAmountPill,
                numericValue === amount && styles.quickAmountPillActive,
              ]}
              onPress={() => handleQuickAmount(amount)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  numericValue === amount && styles.quickAmountTextActive,
                ]}
              >
                ${amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {numberPadKeys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberPadRow}>
            {row.map((key, keyIndex) => {
              const index = rowIndex * 3 + keyIndex;
              return (
                <Animated.View
                  key={key}
                  style={[
                    styles.keyWrapper,
                    { transform: [{ scale: scaleAnims[index] }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.numberKey,
                      key === '⌫' && styles.deleteKey,
                    ]}
                    onPress={() => handleKeyPress(key, index)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.numberKeyText,
                        key === '⌫' && styles.deleteKeyText,
                      ]}
                    >
                      {key}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginTop: 8,
    marginRight: 4,
  },
  amountText: {
    fontSize: 56,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    letterSpacing: -2,
  },
  amountTextSmall: {
    fontSize: 44,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  quickAmountPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: MeruTheme.colors.accent.primary,
    backgroundColor: 'transparent',
  },
  quickAmountPillActive: {
    backgroundColor: MeruTheme.colors.accent.primary,
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
  quickAmountTextActive: {
    color: MeruTheme.colors.background.primary,
  },
  numberPad: {
    width: '100%',
    paddingHorizontal: 32,
  },
  numberPadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  numberKey: {
    height: 64,
    borderRadius: 32,
    backgroundColor: MeruTheme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteKey: {
    backgroundColor: 'transparent',
  },
  numberKeyText: {
    fontSize: 28,
    fontWeight: '500',
    color: MeruTheme.colors.text.primary,
  },
  deleteKeyText: {
    fontSize: 24,
    color: MeruTheme.colors.text.secondary,
  },
});
