// ============================================================================
// Fixed Income Detail Screen - Bond/Treasury Details
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MeruTheme } from '../theme/meru';
import {
  FIXED_INCOME_INSTRUMENTS,
  FixedIncomeInstrument,
  formatYield,
  formatPrice,
  formatDuration,
  getCategoryLabel,
  getRatingColor,
} from '../utils/mockFixedIncomeData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FixedIncomeDetailRouteProp = RouteProp<RootStackParamList, 'FixedIncomeDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function FixedIncomeDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FixedIncomeDetailRouteProp>();
  const { instrumentId } = route.params;

  const instrument = FIXED_INCOME_INSTRUMENTS.find(i => i.id === instrumentId);

  if (!instrument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Instrument not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBuy = () => {
    navigation.navigate('FixedIncomeTrade', { instrumentId, side: 'buy' });
  };

  const handleSell = () => {
    navigation.navigate('FixedIncomeTrade', { instrumentId, side: 'sell' });
  };

  const yieldColor = instrument.yield >= 5 ? MeruTheme.colors.success.primary : MeruTheme.colors.text.primary;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSymbol}>{instrument.symbol}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: MeruTheme.colors.background.tertiary }]}>
            <Text style={styles.categoryText}>{getCategoryLabel(instrument.category)}</Text>
          </View>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Name and Issuer */}
        <View style={styles.titleSection}>
          <Text style={styles.instrumentName}>{instrument.name}</Text>
          <Text style={styles.issuerText}>Issued by {instrument.issuer}</Text>
        </View>

        {/* Price and Yield */}
        <View style={styles.priceSection}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{formatPrice(instrument.price)}</Text>
            <Text style={styles.priceSubtext}>Clean Price</Text>
          </View>
          <View style={styles.yieldBox}>
            <Text style={styles.yieldLabel}>Yield</Text>
            <Text style={[styles.yieldValue, { color: yieldColor }]}>
              {formatYield(instrument.yield)}
            </Text>
            <Text style={styles.yieldSubtext}>Current Yield</Text>
          </View>
        </View>

        {/* Key Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Key Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>YTM</Text>
              <Text style={styles.statValue}>{formatYield(instrument.yieldToMaturity)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Coupon Rate</Text>
              <Text style={styles.statValue}>{formatYield(instrument.couponRate)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Coupon Freq</Text>
              <Text style={styles.statValue}>{instrument.couponFrequency}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formatDuration(instrument.duration)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Mod. Duration</Text>
              <Text style={styles.statValue}>{formatDuration(instrument.modifiedDuration)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Convexity</Text>
              <Text style={styles.statValue}>{instrument.convexity.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Credit Info Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Credit Information</Text>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Credit Rating</Text>
            <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(instrument.creditRating) }]}>
              <Text style={styles.ratingText}>{instrument.creditRating}</Text>
            </View>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Maturity Date</Text>
            <Text style={styles.creditValue}>
              {new Date(instrument.maturityDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Face Value</Text>
            <Text style={styles.creditValue}>${instrument.faceValue.toLocaleString()}</Text>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Min Investment</Text>
            <Text style={styles.creditValue}>${instrument.minimumInvestment.toLocaleString()}</Text>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Accrued Interest</Text>
            <Text style={styles.creditValue}>${instrument.accruedInterest.toFixed(2)}</Text>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Dirty Price</Text>
            <Text style={styles.creditValue}>
              ${(instrument.price + instrument.accruedInterest).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Spread Info */}
        {instrument.spreadToBenchmark > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Spread Analysis</Text>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Spread to Benchmark</Text>
              <Text style={styles.creditValue}>+{(instrument.spreadToBenchmark * 100).toFixed(0)} bps</Text>
            </View>
            <Text style={styles.spreadNote}>
              This bond yields {(instrument.spreadToBenchmark * 100).toFixed(0)} basis points above comparable treasury securities.
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.descriptionText}>{instrument.description}</Text>
        </View>

        {/* Risk Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Risk Disclosure</Text>
          <Text style={styles.warningText}>
            Fixed income investments are subject to interest rate risk, credit risk, and liquidity risk.
            Bond prices move inversely to interest rates. Past performance does not guarantee future results.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Trade Buttons */}
      <View style={styles.tradeButtonsContainer}>
        <TouchableOpacity style={styles.sellButton} onPress={handleSell}>
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 24,
    color: MeruTheme.colors.text.primary,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    color: MeruTheme.colors.text.secondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    alignItems: 'center',
  },
  instrumentName: {
    fontSize: 22,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  issuerText: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  priceSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  priceBox: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    fontWeight: '500',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  priceSubtext: {
    fontSize: 11,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 4,
  },
  yieldBox: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  yieldLabel: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    fontWeight: '500',
    marginBottom: 8,
  },
  yieldValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  yieldSubtext: {
    fontSize: 11,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 4,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '33.33%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  creditLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  creditValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spreadNote: {
    fontSize: 13,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 12,
    lineHeight: 18,
  },
  descriptionText: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    lineHeight: 22,
  },
  warningCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.3)',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB347',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  tradeButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 36,
    backgroundColor: MeruTheme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
    gap: 12,
  },
  sellButton: {
    flex: 1,
    height: 52,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  sellButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  buyButton: {
    flex: 1,
    height: 52,
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
