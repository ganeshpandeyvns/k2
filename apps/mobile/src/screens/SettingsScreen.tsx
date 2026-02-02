// ============================================================================
// Settings Screen - Premium Experience
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import { useFundingStore } from '../store/fundingStore';
import { useThemeStore, PREMIUM_THEMES } from '../store/themeStore';
import { PaletteIcon, CheckIcon } from '../components/icons/TabBarIcons';
import { MeruTheme } from '../theme/meru';
import { useTheme } from '../hooks/useTheme';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { user, exchangeConnections, logout } = useAuthStore();
  const { paymentMethods } = useFundingStore();
  const { currentThemeId, setTheme } = useThemeStore();

  // Get dynamic theme
  const theme = useTheme();

  const handleThemeChange = (themeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(themeId);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Email</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text.secondary }]}>{user?.email || 'dev@k2.app'}</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Display Name</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text.secondary }]}>{user?.displayName || 'Development User'}</Text>
            </View>
          </View>
        </View>

        {/* Exchange & Brokerage Connections */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Connected Exchanges & Brokerages</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.row}>
              <View>
                <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Crypto.com</Text>
                <Text style={[styles.rowSubtext, { color: theme.colors.text.tertiary }]}>Spot crypto trading</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.success.glow }]}>
                <Text style={[styles.statusText, { color: theme.colors.success.primary }]}>Connected</Text>
              </View>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <View style={styles.row}>
              <View>
                <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Kalshi</Text>
                <Text style={[styles.rowSubtext, { color: theme.colors.text.tertiary }]}>Event contracts</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.success.glow }]}>
                <Text style={[styles.statusText, { color: theme.colors.success.primary }]}>Connected</Text>
              </View>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <View style={styles.row}>
              <View>
                <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>DriveWealth</Text>
                <Text style={[styles.rowSubtext, { color: theme.colors.text.tertiary }]}>US stock trading</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.success.glow }]}>
                <Text style={[styles.statusText, { color: theme.colors.success.primary }]}>Connected</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.helperText, { color: theme.colors.text.tertiary }]}>
            Your assets remain at each exchange/brokerage. Meru never holds your funds.</Text>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Push Notifications</Text>
              <Switch
                value={true}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.accent.primary }}
                thumbColor={theme.colors.text.inverse}
              />
            </View>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Order Confirmations</Text>
              <Switch
                value={true}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.accent.primary }}
                thumbColor={theme.colors.text.inverse}
              />
            </View>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Price Alerts</Text>
              <Switch
                value={true}
                trackColor={{ false: theme.colors.background.tertiary, true: theme.colors.accent.primary }}
                thumbColor={theme.colors.text.inverse}
              />
            </View>
          </View>
        </View>

        {/* Appearance - Premium Theme Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PaletteIcon size={20} color={theme.colors.accent.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Appearance</Text>
            <View style={[styles.demoBadge, { backgroundColor: theme.colors.accent.glow }]}>
              <Text style={[styles.demoBadgeText, { color: theme.colors.accent.primary }]}>DEMO</Text>
            </View>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text.tertiary }]}>
            Preview premium themes - for investor demo only
          </Text>
          <View style={styles.themeGrid}>
            {PREMIUM_THEMES.map((themeOption) => {
              const isSelected = currentThemeId === themeOption.id;
              return (
                <Pressable
                  key={themeOption.id}
                  style={[
                    styles.themeCard,
                    { backgroundColor: theme.colors.background.secondary },
                    isSelected && [styles.themeCardSelected, { borderColor: theme.colors.accent.primary, backgroundColor: theme.colors.accent.glow }],
                  ]}
                  onPress={() => handleThemeChange(themeOption.id)}
                >
                  <LinearGradient
                    colors={themeOption.preview as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.themePreview}
                  >
                    {isSelected && (
                      <View style={styles.themeCheckmark}>
                        <CheckIcon size={16} color="#ffffff" />
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={[
                    styles.themeName,
                    { color: theme.colors.text.primary },
                    isSelected && { color: theme.colors.accent.primary },
                  ]}>
                    {themeOption.name}
                  </Text>
                  {themeOption.isDark ? (
                    <Text style={[styles.themeType, { color: theme.colors.text.tertiary }]}>Dark</Text>
                  ) : (
                    <Text style={[styles.themeType, { color: theme.colors.success.primary }]}>Light</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Payment</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('PaymentMethods' as never)}
            >
              <View>
                <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Payment Methods</Text>
                <Text style={[styles.rowSubtext, { color: theme.colors.text.tertiary }]}>
                  {paymentMethods.length > 0
                    ? `${paymentMethods.length} linked account${paymentMethods.length > 1 ? 's' : ''}`
                    : 'No accounts linked'}
                </Text>
              </View>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('KYC' as never)}
            >
              <View>
                <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Identity Verification</Text>
                <Text style={[styles.rowSubtext, { color: theme.colors.text.tertiary }]}>Required for deposits</Text>
              </View>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Security</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <TouchableOpacity style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Two-Factor Authentication</Text>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <TouchableOpacity style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Change Password</Text>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.tertiary }]}>Support</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
            <TouchableOpacity style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Help Center</Text>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <TouchableOpacity style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Contact Support</Text>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <TouchableOpacity style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Privacy Policy</Text>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: theme.colors.background.primary }]} />
            <TouchableOpacity style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]}>Terms of Service</Text>
              <Text style={[styles.rowArrow, { color: theme.colors.text.tertiary }]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.error.glow }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: theme.colors.error.primary }]}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: theme.colors.text.tertiary }]}>K2 v0.1.0 (Development)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rowLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  rowSubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 16,
    color: '#999999',
  },
  rowArrow: {
    fontSize: 18,
    color: '#666666',
  },
  separator: {
    height: 1,
    backgroundColor: '#0D0D0D',
    marginHorizontal: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D4AA',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4D4D',
  },
  version: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  // Theme picker styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  demoBadge: {
    backgroundColor: 'rgba(240, 180, 41, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f0b429',
    letterSpacing: 0.5,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '30%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: '#f0b429',
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
  },
  themePreview: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  themeNameSelected: {
    color: '#f0b429',
  },
  themeType: {
    fontSize: 9,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeTypeLight: {
    color: '#00d4aa',
  },
});
