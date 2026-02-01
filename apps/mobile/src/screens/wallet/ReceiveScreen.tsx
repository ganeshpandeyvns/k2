// ============================================================================
// Receive Screen - Display Wallet Address
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Share,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { MeruTheme } from '../../theme/meru';
import { useWalletStore } from '../../store/walletStore';
import { cryptoAssets } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ReceiveScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Receive'>>();

  const { getAddress } = useWalletStore();

  const [selectedAsset, setSelectedAsset] = useState(route.params?.asset || 'ETH');
  const [copied, setCopied] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const copyFadeAnim = useRef(new Animated.Value(0)).current;

  const assetInfo = cryptoAssets.find((a) => a.symbol === selectedAsset) || cryptoAssets[0];
  const address = getAddress(selectedAsset);

  useEffect(() => {
    if (copied) {
      Animated.sequence([
        Animated.timing(copyFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(copyFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setCopied(false));
    }
  }, [copied]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `My ${selectedAsset} address: ${address}`,
        title: `${selectedAsset} Wallet Address`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Asset Selector */}
        <TouchableOpacity
          style={styles.assetSelector}
          onPress={() => setShowAssetPicker(!showAssetPicker)}
          activeOpacity={0.7}
        >
          <View style={[styles.assetIcon, { backgroundColor: assetInfo.color }]}>
            <Text style={styles.assetIconText}>{selectedAsset.charAt(0)}</Text>
          </View>
          <View style={styles.assetInfo}>
            <Text style={styles.assetName}>{assetInfo.name}</Text>
            <Text style={styles.assetNetwork}>{assetInfo.network} Network</Text>
          </View>
          <Text style={styles.chevron}>{showAssetPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showAssetPicker && (
          <View style={styles.assetPickerContainer}>
            {cryptoAssets.slice(0, 6).map((asset) => (
              <TouchableOpacity
                key={asset.symbol}
                style={[
                  styles.assetOption,
                  selectedAsset === asset.symbol && styles.assetOptionActive,
                ]}
                onPress={() => {
                  setSelectedAsset(asset.symbol);
                  setShowAssetPicker(false);
                }}
              >
                <View style={[styles.assetOptionIcon, { backgroundColor: asset.color }]}>
                  <Text style={styles.assetOptionIconText}>{asset.symbol.charAt(0)}</Text>
                </View>
                <Text style={styles.assetOptionText}>{asset.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={address}
              size={200}
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* Address Display */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Your {selectedAsset} Address</Text>
            <Text style={styles.address} selectable>
              {address}
            </Text>
          </View>

          {/* Copy Button */}
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Text style={styles.copyButtonIcon}>{copied ? '✓' : '📋'}</Text>
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy Address'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Copied Toast */}
        <Animated.View
          style={[
            styles.copiedToast,
            {
              opacity: copyFadeAnim,
              transform: [{
                translateY: copyFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.copiedToastText}>Address copied!</Text>
        </Animated.View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text style={styles.shareButtonIcon}>📤</Text>
          <Text style={styles.shareButtonText}>Share Address</Text>
        </TouchableOpacity>

        {/* Warning Notice */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Only send {selectedAsset} to this address. Sending other assets may result in permanent loss.
          </Text>
        </View>

        {/* Network Info */}
        <View style={styles.networkInfo}>
          <View style={styles.networkInfoRow}>
            <Text style={styles.networkInfoLabel}>Network</Text>
            <Text style={styles.networkInfoValue}>{assetInfo.network}</Text>
          </View>
          <View style={styles.networkInfoRow}>
            <Text style={styles.networkInfoLabel}>Minimum Deposit</Text>
            <Text style={styles.networkInfoValue}>{assetInfo.minSend} {selectedAsset}</Text>
          </View>
          <View style={styles.networkInfoRow}>
            <Text style={styles.networkInfoLabel}>Confirmations</Text>
            <Text style={styles.networkInfoValue}>
              {selectedAsset === 'BTC' ? '2' : selectedAsset === 'ETH' ? '12' : '1'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: MeruTheme.colors.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  assetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 14,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  assetNetwork: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  chevron: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
  assetPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  assetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  assetOptionActive: {
    borderColor: MeruTheme.colors.accent.primary,
  },
  assetOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetOptionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  assetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  qrCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
  },
  addressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 8,
  },
  address: {
    fontSize: 13,
    color: MeruTheme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 20,
    gap: 8,
  },
  copyButtonIcon: {
    fontSize: 16,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },
  copiedToast: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    marginLeft: -60,
    width: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  copiedToastText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  shareButtonIcon: {
    fontSize: 16,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#fbbf24',
    lineHeight: 20,
  },
  networkInfo: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  networkInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  networkInfoLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  networkInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
});
