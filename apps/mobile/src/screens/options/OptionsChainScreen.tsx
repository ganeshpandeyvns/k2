// ============================================================================
// Options Chain Screen - View and trade stock options
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { MeruTheme } from '../../theme/meru';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import {
  generateOptionsChain,
  getOptionsForExpiration,
  StockOption,
  OptionsChain,
} from '../../utils/mockOptionsData';

type OptionsChainRouteProp = RouteProp<RootStackParamList, 'OptionsChain'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Back Arrow Icon
const BackIcon = ({ size = 24, color = MeruTheme.colors.text.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19l-7-7 7-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Call/Put Icons
const CallIcon = ({ size = 16, color = MeruTheme.colors.success.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19V5M5 12l7-7 7 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PutIcon = ({ size = 16, color = MeruTheme.colors.error.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M19 12l-7 7-7-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export function OptionsChainScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OptionsChainRouteProp>();
  const { symbol } = route.params;

  const [selectedType, setSelectedType] = useState<'call' | 'put'>('call');
  const [selectedExpiration, setSelectedExpiration] = useState<string>('');

  // Generate options chain
  const chain = useMemo(() => generateOptionsChain(symbol), [symbol]);

  // Set default expiration when chain loads
  React.useEffect(() => {
    if (chain && chain.expirationDates.length > 0 && !selectedExpiration) {
      setSelectedExpiration(chain.expirationDates[0]);
    }
  }, [chain]);

  // Get filtered options
  const filteredOptions = useMemo(() => {
    if (!chain || !selectedExpiration) return [];
    return getOptionsForExpiration(chain, selectedExpiration, selectedType);
  }, [chain, selectedExpiration, selectedType]);

  if (!chain) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Options Not Available</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Options are not available for {symbol}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatExpirationDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getDaysLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Expires today';
    if (diff === 1) return '1 day';
    return `${diff} days`;
  };

  const handleOptionPress = (option: StockOption) => {
    navigation.navigate('OptionsTrade', { optionId: option.id });
  };

  const renderOptionRow = ({ item }: { item: StockOption }) => {
    const isITM = item.inTheMoney;
    const strikeColor = isITM
      ? selectedType === 'call'
        ? MeruTheme.colors.success.primary
        : MeruTheme.colors.error.primary
      : MeruTheme.colors.text.primary;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.optionRow,
          isITM && styles.optionRowITM,
          pressed && styles.optionRowPressed,
        ]}
        onPress={() => handleOptionPress(item)}
      >
        <View style={styles.optionCell}>
          <Text style={[styles.strikeText, { color: strikeColor }]}>
            ${item.strikePrice.toFixed(0)}
          </Text>
          {isITM && (
            <View style={[styles.itmBadge, { backgroundColor: strikeColor + '20' }]}>
              <Text style={[styles.itmText, { color: strikeColor }]}>ITM</Text>
            </View>
          )}
        </View>

        <View style={styles.optionCell}>
          <Text style={styles.premiumText}>${item.premium.toFixed(2)}</Text>
          <Text style={styles.bidAskText}>
            ${item.bid.toFixed(2)} / ${item.ask.toFixed(2)}
          </Text>
        </View>

        <View style={styles.optionCellSmall}>
          <Text style={styles.volumeText}>{(item.volume / 1000).toFixed(1)}K</Text>
          <Text style={styles.labelText}>Vol</Text>
        </View>

        <View style={styles.optionCellSmall}>
          <Text style={styles.oiText}>{(item.openInterest / 1000).toFixed(1)}K</Text>
          <Text style={styles.labelText}>OI</Text>
        </View>

        <View style={styles.optionCellSmall}>
          <Text style={styles.ivText}>{item.impliedVolatility.toFixed(0)}%</Text>
          <Text style={styles.labelText}>IV</Text>
        </View>

        <View style={styles.optionCellSmall}>
          <Text style={styles.deltaText}>{item.delta.toFixed(2)}</Text>
          <Text style={styles.labelText}>{'\u0394'}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{chain.underlyingSymbol} Options</Text>
          <Text style={styles.headerSubtitle}>{chain.underlyingName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stock Price Banner */}
      <View style={styles.priceBanner}>
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>${chain.underlyingPrice.toFixed(2)}</Text>
          <View style={[
            styles.changeBadge,
            { backgroundColor: chain.change24h >= 0 ? MeruTheme.colors.success.primary + '20' : MeruTheme.colors.error.primary + '20' }
          ]}>
            <Text style={[
              styles.changeText,
              { color: chain.change24h >= 0 ? MeruTheme.colors.success.primary : MeruTheme.colors.error.primary }
            ]}>
              {chain.change24h >= 0 ? '+' : ''}{chain.change24h.toFixed(2)}%
            </Text>
          </View>
        </View>
        <Text style={styles.priceLabel}>Current Stock Price</Text>
      </View>

      {/* Expiration Date Selector */}
      <View style={styles.expirationSection}>
        <Text style={styles.sectionLabel}>Expiration Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.expirationScroll}
        >
          {chain.expirationDates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.expirationChip,
                selectedExpiration === date && styles.expirationChipActive,
              ]}
              onPress={() => setSelectedExpiration(date)}
            >
              <Text style={[
                styles.expirationDateText,
                selectedExpiration === date && styles.expirationDateTextActive,
              ]}>
                {formatExpirationDate(date)}
              </Text>
              <Text style={[
                styles.expirationDaysText,
                selectedExpiration === date && styles.expirationDaysTextActive,
              ]}>
                {getDaysLabel(date)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Call/Put Toggle */}
      <View style={styles.typeToggleContainer}>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === 'call' && styles.typeButtonCallActive,
            ]}
            onPress={() => setSelectedType('call')}
          >
            <CallIcon
              color={selectedType === 'call' ? '#FFFFFF' : MeruTheme.colors.success.primary}
            />
            <Text style={[
              styles.typeButtonText,
              selectedType === 'call' && styles.typeButtonTextActive,
              { color: selectedType === 'call' ? '#FFFFFF' : MeruTheme.colors.success.primary }
            ]}>
              Calls
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === 'put' && styles.typeButtonPutActive,
            ]}
            onPress={() => setSelectedType('put')}
          >
            <PutIcon
              color={selectedType === 'put' ? '#FFFFFF' : MeruTheme.colors.error.primary}
            />
            <Text style={[
              styles.typeButtonText,
              selectedType === 'put' && styles.typeButtonTextActive,
              { color: selectedType === 'put' ? '#FFFFFF' : MeruTheme.colors.error.primary }
            ]}>
              Puts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Chain Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.optionCell}>
          <Text style={styles.headerCellText}>Strike</Text>
        </View>
        <View style={styles.optionCell}>
          <Text style={styles.headerCellText}>Premium</Text>
        </View>
        <View style={styles.optionCellSmall}>
          <Text style={styles.headerCellText}>Vol</Text>
        </View>
        <View style={styles.optionCellSmall}>
          <Text style={styles.headerCellText}>OI</Text>
        </View>
        <View style={styles.optionCellSmall}>
          <Text style={styles.headerCellText}>IV</Text>
        </View>
        <View style={styles.optionCellSmall}>
          <Text style={styles.headerCellText}>{'\u0394'}</Text>
        </View>
      </View>

      {/* Options List */}
      <FlatList
        data={filteredOptions}
        renderItem={renderOptionRow}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: MeruTheme.colors.success.primary }]} />
          <Text style={styles.legendText}>ITM Call</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: MeruTheme.colors.error.primary }]} />
          <Text style={styles.legendText}>ITM Put</Text>
        </View>
        <Text style={styles.legendHint}>Tap option to trade</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
  },
  priceBanner: {
    backgroundColor: MeruTheme.colors.background.secondary,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceLabel: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 4,
  },
  expirationSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MeruTheme.colors.text.tertiary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  expirationScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  expirationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
    alignItems: 'center',
    marginRight: 8,
  },
  expirationChipActive: {
    backgroundColor: MeruTheme.colors.accent.primary,
    borderColor: MeruTheme.colors.accent.primary,
  },
  expirationDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  expirationDateTextActive: {
    color: '#FFFFFF',
  },
  expirationDaysText: {
    fontSize: 11,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 2,
  },
  expirationDaysTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  typeToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  typeButtonCallActive: {
    backgroundColor: MeruTheme.colors.success.primary,
  },
  typeButtonPutActive: {
    backgroundColor: MeruTheme.colors.error.primary,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: '600',
    color: MeruTheme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 100,
  },
  optionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  optionRowITM: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  optionRowPressed: {
    backgroundColor: MeruTheme.colors.background.secondary,
  },
  optionCell: {
    flex: 2,
    justifyContent: 'center',
  },
  optionCellSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strikeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itmBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  itmText: {
    fontSize: 10,
    fontWeight: '700',
  },
  premiumText: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  bidAskText: {
    fontSize: 11,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 2,
  },
  volumeText: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  oiText: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  ivText: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  labelText: {
    fontSize: 9,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
  legendHint: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});
