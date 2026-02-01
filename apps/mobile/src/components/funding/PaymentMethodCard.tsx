// ============================================================================
// Payment Method Card Component
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MeruTheme } from '../../theme/meru';
import { mockBanks, type MockBank } from '../../utils/mockData';
import type { PaymentMethod } from '../../store/fundingStore';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected?: boolean;
  onPress?: () => void;
  showChevron?: boolean;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  selected = false,
  onPress,
  showChevron = false,
}) => {
  const bank = mockBanks.find((b) => b.id === method.bankId);
  const bankColor = bank?.color || MeruTheme.colors.accent.primary;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Bank Icon */}
      <View style={[styles.iconContainer, { backgroundColor: bankColor }]}>
        <Text style={styles.iconText}>
          {method.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.bankName}>{method.name}</Text>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.accountInfo}>
          {method.accountType ? `${method.accountType.charAt(0).toUpperCase() + method.accountType.slice(1)} ` : ''}
          ••••{method.lastFour}
        </Text>
      </View>

      {/* Right Side */}
      <View style={styles.rightContainer}>
        {selected ? (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        ) : method.status === 'verified' ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
        {showChevron && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Compact version for selection
export const PaymentMethodCardCompact: React.FC<{
  method: PaymentMethod;
  onPress: () => void;
}> = ({ method, onPress }) => {
  const bank = mockBanks.find((b) => b.id === method.bankId);
  const bankColor = bank?.color || MeruTheme.colors.accent.primary;

  return (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.compactIcon, { backgroundColor: bankColor }]}>
        <Text style={styles.compactIconText}>
          {method.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.compactDetails}>
        <Text style={styles.compactBankName}>{method.name}</Text>
        <Text style={styles.compactAccountInfo}>••••{method.lastFour}</Text>
      </View>
      <Text style={styles.changeText}>Change</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  containerSelected: {
    borderColor: MeruTheme.colors.accent.primary,
    backgroundColor: 'rgba(240, 180, 41, 0.08)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: MeruTheme.colors.accent.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
    textTransform: 'uppercase',
  },
  accountInfo: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MeruTheme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  pendingBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  chevron: {
    fontSize: 24,
    color: MeruTheme.colors.text.tertiary,
    marginLeft: 4,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    padding: 14,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  compactDetails: {
    flex: 1,
    marginLeft: 12,
  },
  compactBankName: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  compactAccountInfo: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    marginTop: 1,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
});
