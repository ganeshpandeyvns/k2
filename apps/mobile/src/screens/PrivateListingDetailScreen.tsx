// ============================================================================
// Private Listing Detail Screen - Exclusive Deal Room
// ============================================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency } from '../theme/meru';
import { useTheme } from '../hooks/useTheme';
import {
  PRIVATE_LISTING_MAP,
  PrivateListing,
  getDealTypeLabel,
  getDealStatusColor,
  getDaysUntilClose,
  formatValuation,
  getSectorIcon,
  getRiskColor,
} from '../utils/mockPrivateStockData';

type RouteParams = {
  PrivateListingDetail: {
    id: string;
  };
};

export function PrivateListingDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PrivateListingDetail'>>();
  const { id } = route.params;
  const theme = useTheme();

  // Get listing data
  const listing = PRIVATE_LISTING_MAP[id];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate time remaining until auction close
  useEffect(() => {
    if (!listing) return;

    const calculateTimeLeft = () => {
      const closeDate = new Date(listing.closingDate);
      const now = new Date();
      const diff = closeDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [listing?.closingDate]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for countdown
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  if (!listing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Listing not found
          </Text>
        </View>
      </View>
    );
  }

  const daysLeft = getDaysUntilClose(listing.closingDate);
  const progressPercent = (listing.amountRaised / listing.targetRaise) * 100;
  const statusColor = getDealStatusColor(listing.status);

  const handleInvest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PrivateListingInvest' as never, { id: listing.id } as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Deal Room</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {listing.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Deal Header */}
        <Animated.View
          style={[
            styles.dealHeader,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.dealIcon, { backgroundColor: theme.colors.accent.glow }]}>
            <Text style={styles.dealIconText}>{getSectorIcon(listing.sector)}</Text>
          </View>
          <Text style={[styles.dealName, { color: theme.colors.text.primary }]}>{listing.name}</Text>
          <Text style={[styles.dealType, { color: theme.colors.text.tertiary }]}>
            {getDealTypeLabel(listing.dealType)} · {listing.targetCompany}
          </Text>
        </Animated.View>

        {/* Progress Section */}
        <Animated.View
          style={[
            styles.progressSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.raisedAmount, { color: theme.colors.text.primary }]}>
              {formatCurrency(listing.amountRaised)}
            </Text>
            <Text style={[styles.targetAmount, { color: theme.colors.text.tertiary }]}>
              of {formatCurrency(listing.targetRaise)}
            </Text>
          </View>

          <View style={[styles.progressBar, { backgroundColor: theme.colors.background.tertiary }]}>
            <LinearGradient
              colors={[theme.colors.accent.primary, theme.colors.accent.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]}
            />
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: theme.colors.text.primary }]}>
                {listing.investorCount}
              </Text>
              <Text style={[styles.progressStatLabel, { color: theme.colors.text.tertiary }]}>
                Investors
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: theme.colors.text.primary }]}>
                {progressPercent.toFixed(0)}%
              </Text>
              <Text style={[styles.progressStatLabel, { color: theme.colors.text.tertiary }]}>
                Funded
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: daysLeft <= 5 ? theme.colors.error.primary : theme.colors.text.primary }]}>
                {daysLeft}
              </Text>
              <Text style={[styles.progressStatLabel, { color: theme.colors.text.tertiary }]}>
                Days Left
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Blind Auction Section */}
        <Animated.View
          style={[
            styles.auctionSection,
            { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.accent.primary + '20', theme.colors.background.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.auctionCard, { borderColor: theme.colors.accent.primary }]}
          >
            {/* Auction Header */}
            <View style={styles.auctionHeader}>
              <Text style={styles.auctionIcon}>🔒</Text>
              <View>
                <Text style={[styles.auctionTitle, { color: theme.colors.accent.primary }]}>
                  BLIND AUCTION
                </Text>
                <Text style={[styles.auctionSubtitle, { color: theme.colors.text.secondary }]}>
                  Bids are hidden until auction closes
                </Text>
              </View>
            </View>

            {/* Countdown Timer */}
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdownLabel, { color: theme.colors.text.tertiary }]}>
                AUCTION CLOSES IN
              </Text>
              <View style={styles.countdownRow}>
                <View style={styles.countdownUnit}>
                  <View style={[styles.countdownBox, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.countdownValue, { color: theme.colors.text.primary }]}>
                      {String(timeLeft.days).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={[styles.countdownUnitLabel, { color: theme.colors.text.tertiary }]}>DAYS</Text>
                </View>
                <Text style={[styles.countdownSeparator, { color: theme.colors.accent.primary }]}>:</Text>
                <View style={styles.countdownUnit}>
                  <View style={[styles.countdownBox, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.countdownValue, { color: theme.colors.text.primary }]}>
                      {String(timeLeft.hours).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={[styles.countdownUnitLabel, { color: theme.colors.text.tertiary }]}>HRS</Text>
                </View>
                <Text style={[styles.countdownSeparator, { color: theme.colors.accent.primary }]}>:</Text>
                <View style={styles.countdownUnit}>
                  <View style={[styles.countdownBox, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.countdownValue, { color: theme.colors.text.primary }]}>
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={[styles.countdownUnitLabel, { color: theme.colors.text.tertiary }]}>MIN</Text>
                </View>
                <Text style={[styles.countdownSeparator, { color: theme.colors.accent.primary }]}>:</Text>
                <View style={styles.countdownUnit}>
                  <View style={[styles.countdownBox, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.countdownValue, { color: theme.colors.error.primary }]}>
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={[styles.countdownUnitLabel, { color: theme.colors.text.tertiary }]}>SEC</Text>
                </View>
              </View>
            </View>

            {/* Auction Stats */}
            <View style={[styles.auctionStats, { borderTopColor: theme.colors.border.subtle }]}>
              <View style={styles.auctionStat}>
                <Text style={[styles.auctionStatValue, { color: theme.colors.text.primary }]}>
                  {listing.investorCount}
                </Text>
                <Text style={[styles.auctionStatLabel, { color: theme.colors.text.tertiary }]}>
                  Active Bidders
                </Text>
              </View>
              <View style={[styles.auctionStatDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.auctionStat}>
                <Text style={[styles.auctionStatValue, { color: theme.colors.accent.primary }]}>
                  HIDDEN
                </Text>
                <Text style={[styles.auctionStatLabel, { color: theme.colors.text.tertiary }]}>
                  Current High Bid
                </Text>
              </View>
              <View style={[styles.auctionStatDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.auctionStat}>
                <Text style={[styles.auctionStatValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(listing.minimumInvestment)}
                </Text>
                <Text style={[styles.auctionStatLabel, { color: theme.colors.text.tertiary }]}>
                  Min Bid
                </Text>
              </View>
            </View>

            {/* Auction Info */}
            <View style={[styles.auctionInfo, { backgroundColor: theme.colors.background.primary + '80' }]}>
              <Text style={[styles.auctionInfoText, { color: theme.colors.text.secondary }]}>
                💡 Submit your bid before the auction closes. All bids remain confidential until results are announced.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Description */}
        <Animated.View
          style={[
            styles.descSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>About This Deal</Text>
          <Text style={[styles.descText, { color: theme.colors.text.secondary }]}>
            {listing.description}
          </Text>
        </Animated.View>

        {/* Investment Terms */}
        <Animated.View
          style={[
            styles.termsSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Investment Terms</Text>

          <View style={styles.termRow}>
            <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Minimum Investment</Text>
            <Text style={[styles.termValue, { color: theme.colors.accent.primary, fontWeight: '700' }]}>
              {formatCurrency(listing.minimumInvestment)}
            </Text>
          </View>

          {listing.maximumInvestment && (
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Maximum Investment</Text>
              <Text style={[styles.termValue, { color: theme.colors.text.primary }]}>
                {formatCurrency(listing.maximumInvestment)}
              </Text>
            </View>
          )}

          <View style={styles.termRow}>
            <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Share Price</Text>
            <Text style={[styles.termValue, { color: theme.colors.text.primary }]}>
              ${listing.sharePrice.toFixed(2)}
            </Text>
          </View>

          {listing.estimatedValuation > 0 && (
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Estimated Valuation</Text>
              <Text style={[styles.termValue, { color: theme.colors.text.primary }]}>
                {formatValuation(listing.estimatedValuation)}
              </Text>
            </View>
          )}

          <View style={styles.termRow}>
            <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Lockup Period</Text>
            <Text style={[styles.termValue, { color: theme.colors.text.primary }]}>
              {listing.lockupPeriod}
            </Text>
          </View>

          {listing.carriedInterest && (
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Carried Interest</Text>
              <Text style={[styles.termValue, { color: theme.colors.text.primary }]}>
                {listing.carriedInterest}%
              </Text>
            </View>
          )}

          {listing.managementFee && (
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Management Fee</Text>
              <Text style={[styles.termValue, { color: theme.colors.text.primary }]}>
                {listing.managementFee}%
              </Text>
            </View>
          )}

          <View style={styles.termRow}>
            <Text style={[styles.termLabel, { color: theme.colors.text.tertiary }]}>Closing Date</Text>
            <Text style={[styles.termValue, { color: daysLeft <= 5 ? theme.colors.error.primary : theme.colors.text.primary }]}>
              {new Date(listing.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </Animated.View>

        {/* Documents */}
        <Animated.View
          style={[
            styles.docsSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Documents</Text>
          {listing.documents.map((doc, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.docRow, { borderBottomColor: theme.colors.border.subtle }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Text style={styles.docIcon}>📄</Text>
              <Text style={[styles.docName, { color: theme.colors.text.primary }]}>{doc}</Text>
              <Text style={[styles.docAction, { color: theme.colors.accent.primary }]}>View</Text>
            </TouchableOpacity>
          ))}
          <Text style={[styles.docNote, { color: theme.colors.text.muted }]}>
            Demo mode - Documents are for illustration purposes
          </Text>
        </Animated.View>

        {/* Risk Warning */}
        <Animated.View
          style={[
            styles.riskSection,
            { backgroundColor: getRiskColor(listing.riskLevel) + '15', borderColor: getRiskColor(listing.riskLevel), opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.riskTitle, { color: getRiskColor(listing.riskLevel) }]}>
            ⚠️ {listing.riskLevel} Risk Investment
          </Text>
          <Text style={[styles.riskText, { color: theme.colors.text.secondary }]}>
            Private investments are illiquid, speculative, and involve significant risk of loss. Only invest funds you can afford to lose entirely. Past performance does not guarantee future results.
          </Text>
        </Animated.View>

        {/* Demo Notice */}
        <View style={[styles.demoNotice, { backgroundColor: theme.colors.accent.glow }]}>
          <Text style={[styles.demoText, { color: theme.colors.accent.primary }]}>
            Demo Mode - Simulated Private Placement
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.subtle }]}>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionLabel, { color: theme.colors.text.tertiary }]}>Minimum</Text>
          <Text style={[styles.actionAmount, { color: theme.colors.text.primary }]}>
            {formatCurrency(listing.minimumInvestment)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.investButton, { backgroundColor: theme.colors.accent.primary }]}
          onPress={handleInvest}
        >
          <Text style={[styles.investButtonText, { color: theme.colors.background.primary }]}>
            Invest Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  dealHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  dealIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dealIconText: {
    fontSize: 32,
  },
  dealName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  dealType: {
    fontSize: 14,
  },
  progressSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  raisedAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  targetAmount: {
    fontSize: 14,
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  descSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },
  termsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  termLabel: {
    fontSize: 14,
  },
  termValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  docsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  docIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  docName: {
    flex: 1,
    fontSize: 14,
  },
  docAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  docNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  riskSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  riskText: {
    fontSize: 12,
    lineHeight: 18,
  },
  demoNotice: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  demoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 16,
  },
  actionInfo: {},
  actionLabel: {
    fontSize: 11,
  },
  actionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  investButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  investButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Blind Auction Styles
  auctionSection: {
    marginBottom: 16,
  },
  auctionCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
  },
  auctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  auctionIcon: {
    fontSize: 32,
  },
  auctionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  auctionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownUnit: {
    alignItems: 'center',
  },
  countdownBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownValue: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  countdownUnitLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  countdownSeparator: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  auctionStats: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  auctionStat: {
    flex: 1,
    alignItems: 'center',
  },
  auctionStatDivider: {
    width: 1,
    height: 40,
  },
  auctionStatValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  auctionStatLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  auctionInfo: {
    padding: 12,
    borderRadius: 10,
  },
  auctionInfoText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
