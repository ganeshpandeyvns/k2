// ============================================================================
// Meru Root Navigator - Premium Navigation Experience
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { MeruTheme } from '../theme/meru';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { MarketsScreen } from '../screens/MarketsScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { InstrumentDetailScreen } from '../screens/InstrumentDetailScreen';
import { OrderConfirmScreen } from '../screens/OrderConfirmScreen';

// Funding Screens
import { DepositScreen } from '../screens/funding/DepositScreen';
import { WithdrawScreen } from '../screens/funding/WithdrawScreen';
import { PaymentMethodsScreen } from '../screens/funding/PaymentMethodsScreen';
import { AddBankScreen } from '../screens/funding/AddBankScreen';
import { TransactionSuccessScreen } from '../screens/funding/TransactionSuccessScreen';

// KYC Screens
import { KYCScreen } from '../screens/kyc/KYCScreen';
import { PersonalInfoScreen } from '../screens/kyc/PersonalInfoScreen';
import { IDUploadScreen } from '../screens/kyc/IDUploadScreen';

// Wallet Screens
import { SendScreen } from '../screens/wallet/SendScreen';
import { ReceiveScreen } from '../screens/wallet/ReceiveScreen';

// Swap Screens
import { SwapScreen } from '../screens/swap/SwapScreen';

// Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Main: undefined;
  InstrumentDetail: { instrumentId: string };
  Trade: { instrumentId: string; side?: 'buy' | 'sell' };
  OrderConfirm: { orderId: string };
  // Funding
  Deposit: undefined;
  Withdraw: undefined;
  PaymentMethods: undefined;
  AddBank: undefined;
  TransactionSuccess: { type: 'deposit' | 'withdraw'; amount: number; reference: string };
  // KYC
  KYC: undefined;
  PersonalInfo: undefined;
  IDUpload: undefined;
  // Wallet
  Send: { asset?: string };
  Receive: { asset?: string };
  // Swap
  Swap: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Markets: undefined;
  Portfolio: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Import premium SVG icons
import { HomeIcon, MarketsIcon, PortfolioIcon, SettingsIcon } from '../components/icons/TabBarIcons';

// Custom Tab Bar Icon Component
const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const IconComponent = {
    Home: HomeIcon,
    Markets: MarketsIcon,
    Portfolio: PortfolioIcon,
    Settings: SettingsIcon,
  }[label];

  return (
    <View style={styles.tabIconContainer}>
      {IconComponent && <IconComponent size={24} focused={focused} />}
      {focused && <View style={styles.tabIndicator} />}
    </View>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: MeruTheme.colors.background.secondary,
          borderTopColor: MeruTheme.colors.border.subtle,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: MeruTheme.colors.accent.primary,
        tabBarInactiveTintColor: MeruTheme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketsScreen}
        options={{
          tabBarLabel: 'Markets',
          tabBarIcon: ({ focused }) => <TabIcon label="Markets" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ focused }) => <TabIcon label="Portfolio" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: MeruTheme.colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="InstrumentDetail"
            component={InstrumentDetailScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Trade"
            component={TradeScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen
            name="OrderConfirm"
            component={OrderConfirmScreen}
            options={{ animation: 'fade' }}
          />
          {/* Funding Screens */}
          <Stack.Screen
            name="Deposit"
            component={DepositScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Withdraw"
            component={WithdrawScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="PaymentMethods"
            component={PaymentMethodsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="AddBank"
            component={AddBankScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="TransactionSuccess"
            component={TransactionSuccessScreen}
            options={{ animation: 'fade', gestureEnabled: false }}
          />
          {/* KYC Screens */}
          <Stack.Screen
            name="KYC"
            component={KYCScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="PersonalInfo"
            component={PersonalInfoScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="IDUpload"
            component={IDUploadScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Wallet Screens */}
          <Stack.Screen
            name="Send"
            component={SendScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Receive"
            component={ReceiveScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          {/* Swap Screen */}
          <Stack.Screen
            name="Swap"
            component={SwapScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MeruTheme.colors.accent.primary,
  },
});
