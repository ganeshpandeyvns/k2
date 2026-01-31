// ============================================================================
// Markets Screen - Browse Crypto & Events
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { MarketRow } from '../components/MarketRow';

type TabType = 'crypto' | 'events';

export function MarketsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('crypto');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: cryptoInstruments } = useQuery({
    queryKey: ['instruments', 'crypto'],
    queryFn: () => api.getInstruments('crypto'),
  });

  const { data: eventInstruments } = useQuery({
    queryKey: ['instruments', 'events'],
    queryFn: () => api.getInstruments('event'),
  });

  const { data: quotes, refetch } = useQuery({
    queryKey: ['quotes', activeTab],
    queryFn: () => {
      const instruments = activeTab === 'crypto' ? cryptoInstruments : eventInstruments;
      if (!instruments) return [];
      return api.getQuotes(instruments.map((i: any) => i.id));
    },
    enabled: !!(activeTab === 'crypto' ? cryptoInstruments : eventInstruments),
    refetchInterval: 3000,
  });

  const instruments = activeTab === 'crypto' ? cryptoInstruments : eventInstruments;

  const filteredInstruments = instruments?.filter((instrument: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      instrument.id.toLowerCase().includes(query) ||
      instrument.displayName.toLowerCase().includes(query) ||
      instrument.baseAsset.toLowerCase().includes(query)
    );
  });

  const getQuote = (instrumentId: string) => {
    return quotes?.find((q: any) => q.instrument === instrumentId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Markets</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search markets..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crypto' && styles.activeTab]}
          onPress={() => setActiveTab('crypto')}
        >
          <Text style={[styles.tabText, activeTab === 'crypto' && styles.activeTabText]}>
            Crypto
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* Market List */}
      <FlatList
        data={filteredInstruments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MarketRow
            instrument={item}
            quote={getQuote(item.id)}
            onPress={() =>
              navigation.navigate('InstrumentDetail' as never, {
                instrumentId: item.id,
              } as never)
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No markets found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#00D4AA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: '#1A1A1A',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});
