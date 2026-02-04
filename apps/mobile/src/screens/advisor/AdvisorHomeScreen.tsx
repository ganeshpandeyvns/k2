// ============================================================================
// Advisor Home Screen - Portfolio Health & Insights Dashboard
// ============================================================================

import React, { useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../hooks/useTheme';
import { useAIAdvisorStore, AdvisorInsight } from '../../store/aiAdvisorStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useFundingStore } from '../../store/fundingStore';
import Svg, { Circle, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function AdvisorHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  const holdings = usePortfolioStore(state => state.holdings);
  const cashBalance = useFundingStore(state => state.cashBalance);

  const {
    healthScore,
    insights,
    calculateHealthScore,
    generateInsights,
    dismissInsight,
  } = useAIAdvisorStore();

  // Calculate health score on mount and when holdings change
  useEffect(() => {
    calculateHealthScore(holdings, cashBalance);
    generateInsights(holdings, cashBalance);
  }, [holdings, cashBalance]);

  const handleStartChat = () => {
    navigation.navigate('AdvisorChat');
  };

  const handleInsightPress = (insight: AdvisorInsight) => {
    navigation.navigate('AdvisorChat');
  };

  // Helper functions for colors
  const getScoreColor = (s: number) => {
    if (s >= 80) return theme.colors.success.primary;
    if (s >= 60) return '#FFB347';
    return theme.colors.error.primary;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getCategoryColor = (category: AdvisorInsight['category']) => {
    switch (category) {
      case 'action': return theme.colors.accent.primary;
      case 'warning': return '#FFB347';
      case 'opportunity': return theme.colors.success.primary;
      case 'education': return '#4A90D9';
      default: return theme.colors.text.secondary;
    }
  };

  const getCategoryIcon = (category: AdvisorInsight['category']) => {
    switch (category) {
      case 'action': return '⚡';
      case 'warning': return '⚠️';
      case 'opportunity': return '💰';
      case 'education': return '📖';
      default: return 'ℹ️';
    }
  };

  // Health Gauge Component
  const renderHealthGauge = (score: number) => {
    const size = 180;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * Math.PI;
    const progress = (score / 100) * circumference;

    return (
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size / 2 + 20}>
          <G rotation="-180" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.background.tertiary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeLinecap="round"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getScoreColor(score)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${progress} ${circumference}`}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View style={styles.scoreTextContainer}>
          <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { color: theme.colors.text.secondary }]}>
            {getScoreLabel(score)}
          </Text>
        </View>
      </View>
    );
  };

  // Score Detail Item
  const renderScoreDetail = (label: string, score: number, description: string) => (
    <View style={styles.scoreDetailItem} key={label}>
      <View style={styles.scoreDetailHeader}>
        <Text style={[styles.scoreDetailLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
        <Text style={[styles.scoreDetailValue, { color: getScoreColor(score) }]}>{score}</Text>
      </View>
      <View style={[styles.scoreDetailBarBg, { backgroundColor: theme.colors.background.tertiary }]}>
        <View
          style={[
            styles.scoreDetailBar,
            { width: `${score}%`, backgroundColor: getScoreColor(score) },
          ]}
        />
      </View>
      <Text style={[styles.scoreDetailDescription, { color: theme.colors.text.tertiary }]}>
        {description}
      </Text>
    </View>
  );

  // Insight Card
  const renderInsightCard = (insight: AdvisorInsight) => (
    <TouchableOpacity
      key={insight.id}
      style={[styles.insightCard, { backgroundColor: theme.colors.background.secondary }]}
      onPress={() => handleInsightPress(insight)}
      activeOpacity={0.8}
    >
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: getCategoryColor(insight.category) }]}>
          <Text style={styles.insightIconText}>{getCategoryIcon(insight.category)}</Text>
        </View>
        <View style={styles.insightTitleContainer}>
          <Text style={[styles.insightTitle, { color: theme.colors.text.primary }]}>
            {insight.title}
          </Text>
          {insight.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Text style={[styles.priorityText, { color: theme.colors.error.primary }]}>
                High Priority
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={() => dismissInsight(insight.id)}>
          <Text style={[styles.dismissText, { color: theme.colors.text.tertiary }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.insightSummary, { color: theme.colors.text.secondary }]}>
        {insight.summary}
      </Text>
      {insight.actionable && (
        <View style={[styles.insightFooter, { borderTopColor: theme.colors.border.subtle }]}>
          <Text style={[styles.insightAction, { color: getCategoryColor(insight.category) }]}>
            Learn More →
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar barStyle={theme.colors.background.primary === '#050507' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>AI Advisor</Text>
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: theme.colors.accent.primary }]}
          onPress={handleStartChat}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Health Score Card */}
        <View style={[styles.healthCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.healthTitle, { color: theme.colors.text.primary }]}>
            Portfolio Health Score
          </Text>
          {healthScore ? (
            <>
              {renderHealthGauge(healthScore.overall)}

              <View style={styles.scoreBreakdown}>
                {renderScoreDetail('Diversification', healthScore.diversification, 'Asset class variety')}
                {renderScoreDetail('Risk-Adjusted', healthScore.riskAdjusted, 'Return vs volatility')}
                {renderScoreDetail('Liquidity', healthScore.liquidity, 'Cash availability')}
                {renderScoreDetail('Growth Potential', healthScore.growthPotential, 'Upside opportunity')}
              </View>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                Analyzing portfolio...
              </Text>
            </View>
          )}
        </View>

        {/* Insights Section */}
        <View style={styles.insightsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Insights & Recommendations
          </Text>
          {insights.length > 0 ? (
            insights.map(renderInsightCard)
          ) : (
            <View style={[styles.noInsightsCard, { backgroundColor: theme.colors.background.secondary }]}>
              <Text style={styles.noInsightsEmoji}>✨</Text>
              <Text style={[styles.noInsightsText, { color: theme.colors.text.primary }]}>
                Your portfolio looks great!
              </Text>
              <Text style={[styles.noInsightsSubtext, { color: theme.colors.text.secondary }]}>
                No immediate recommendations at this time.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={handleStartChat}
            >
              <Text style={styles.actionEmoji}>💬</Text>
              <Text style={[styles.actionLabel, { color: theme.colors.text.primary }]}>
                Ask a Question
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate('Main', { screen: 'Markets' } as any)}
            >
              <Text style={styles.actionEmoji}>📊</Text>
              <Text style={[styles.actionLabel, { color: theme.colors.text.primary }]}>
                Browse Markets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate('Main', { screen: 'Portfolio' } as any)}
            >
              <Text style={styles.actionEmoji}>💼</Text>
              <Text style={[styles.actionLabel, { color: theme.colors.text.primary }]}>
                View Portfolio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.background.secondary }]}
              onPress={handleStartChat}
            >
              <Text style={styles.actionEmoji}>📚</Text>
              <Text style={[styles.actionLabel, { color: theme.colors.text.primary }]}>
                Learn More
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={[
          styles.disclaimerCard,
          {
            backgroundColor: theme.colors.background.tertiary,
            borderColor: theme.colors.border.subtle,
          }
        ]}>
          <Text style={[styles.disclaimerTitle, { color: theme.colors.text.secondary }]}>
            Important Disclosure
          </Text>
          <Text style={[styles.disclaimerText, { color: theme.colors.text.tertiary }]}>
            This AI-powered advisor provides educational information only and should not be
            considered personalized financial advice. Always consult with a licensed financial
            professional before making investment decisions.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  chatButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  healthCard: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTextContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  scoreBreakdown: {
    marginTop: 8,
  },
  scoreDetailItem: {
    marginBottom: 16,
  },
  scoreDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scoreDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreDetailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreDetailBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreDetailBar: {
    height: '100%',
    borderRadius: 3,
  },
  scoreDetailDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  insightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightIconText: {
    fontSize: 16,
  },
  insightTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  priorityBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
  },
  insightSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  insightAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  noInsightsCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noInsightsEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  noInsightsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noInsightsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimerCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
