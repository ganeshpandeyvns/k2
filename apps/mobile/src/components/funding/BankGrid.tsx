// ============================================================================
// Bank Grid Component - Bank Selection for Plaid-style flow
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';
import { mockBanks, type MockBank } from '../../utils/mockData';

interface BankGridProps {
  onSelectBank: (bank: MockBank) => void;
}

export const BankGrid: React.FC<BankGridProps> = ({ onSelectBank }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) return mockBanks;
    const query = searchQuery.toLowerCase();
    return mockBanks.filter((bank) =>
      bank.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectBank = (bank: MockBank) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectBank(bank);
  };

  const renderBank = ({ item }: { item: MockBank }) => (
    <TouchableOpacity
      style={styles.bankItem}
      onPress={() => handleSelectBank(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.bankIcon, { backgroundColor: item.color }]}>
        <Text style={styles.bankIconText}>
          {item.name.charAt(0)}
        </Text>
      </View>
      <Text style={styles.bankName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for your bank"
          placeholderTextColor={MeruTheme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Popular Banks Label */}
      {!searchQuery && (
        <Text style={styles.sectionLabel}>Popular Banks</Text>
      )}

      {/* Bank Grid */}
      {filteredBanks.length > 0 ? (
        <FlatList
          data={filteredBanks}
          renderItem={renderBank}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏦</Text>
          <Text style={styles.emptyTitle}>No banks found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for a different bank
          </Text>
        </View>
      )}

      {/* Manual Entry Option */}
      <TouchableOpacity style={styles.manualEntry} activeOpacity={0.7}>
        <Text style={styles.manualEntryIcon}>➕</Text>
        <Text style={styles.manualEntryText}>Enter bank details manually</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 52,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContent: {
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  bankItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bankIconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  bankName: {
    fontSize: 12,
    fontWeight: '500',
    color: MeruTheme.colors.text.primary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  manualEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
  },
  manualEntryIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.7,
  },
  manualEntryText: {
    fontSize: 15,
    fontWeight: '500',
    color: MeruTheme.colors.accent.primary,
  },
});
