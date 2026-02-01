// ============================================================================
// KYC Screen - Verification Hub
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { useKYCStore } from '../../store/kycStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  screen: keyof RootStackParamList;
  completed: boolean;
}

export const KYCScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { status, personalInfo, documents, selfieVerified, getProgress } = useKYCStore();

  const progress = getProgress();

  const steps: VerificationStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Name, address, and date of birth',
      screen: 'PersonalInfo' as any,
      completed: !!personalInfo,
    },
    {
      id: 'document',
      title: 'Identity Document',
      description: 'Upload a government-issued ID',
      screen: 'IDUpload' as any,
      completed: documents.length > 0,
    },
    {
      id: 'selfie',
      title: 'Selfie Verification',
      description: 'Take a quick selfie for verification',
      screen: 'IDUpload' as any,
      completed: selfieVerified,
    },
  ];

  const currentStepIndex = steps.findIndex((s) => !s.completed);
  const nextStep = steps[currentStepIndex];

  const handleStepPress = (step: VerificationStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(step.screen);
  };

  const handleContinue = () => {
    if (nextStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate(nextStep.screen);
    }
  };

  const getStatusBanner = () => {
    switch (status) {
      case 'verified':
        return {
          color: '#22c55e',
          bg: 'rgba(34, 197, 94, 0.15)',
          icon: '✓',
          title: 'Verified',
          subtitle: 'Your identity has been verified',
        };
      case 'pending':
        return {
          color: '#fbbf24',
          bg: 'rgba(251, 191, 36, 0.15)',
          icon: '⏳',
          title: 'Pending Review',
          subtitle: 'Your documents are being reviewed',
        };
      case 'rejected':
        return {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          icon: '✕',
          title: 'Verification Failed',
          subtitle: 'Please try again with valid documents',
        };
      default:
        return {
          color: MeruTheme.colors.accent.primary,
          bg: 'rgba(240, 180, 41, 0.15)',
          icon: '🔐',
          title: 'Verification Required',
          subtitle: 'Complete verification to start trading',
        };
    }
  };

  const statusBanner = getStatusBanner();

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
        <Text style={styles.headerTitle}>Verify Identity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusBanner.bg }]}>
          <View style={[styles.statusIcon, { backgroundColor: statusBanner.color }]}>
            <Text style={styles.statusIconText}>{statusBanner.icon}</Text>
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: statusBanner.color }]}>
              {statusBanner.title}
            </Text>
            <Text style={styles.statusSubtitle}>{statusBanner.subtitle}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {status !== 'verified' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress}% Complete</Text>
          </View>
        )}

        {/* Verification Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex && status !== 'verified';
            const isCompleted = step.completed;
            const isLocked = index > currentStepIndex && status !== 'verified';

            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepCard,
                  isActive && styles.stepCardActive,
                  isCompleted && styles.stepCardCompleted,
                ]}
                onPress={() => handleStepPress(step)}
                disabled={isLocked}
                activeOpacity={0.7}
              >
                {/* Step Number / Checkmark */}
                <View
                  style={[
                    styles.stepNumber,
                    isCompleted && styles.stepNumberCompleted,
                    isActive && styles.stepNumberActive,
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.stepCheckmark}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.stepNumberText,
                        isActive && styles.stepNumberTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                {/* Step Content */}
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCompleted && styles.stepTitleCompleted,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>

                {/* Chevron */}
                {!isLocked && (
                  <Text style={styles.stepChevron}>›</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why verify?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🛡️</Text>
            <Text style={styles.infoText}>
              Protect your account from unauthorized access
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoText}>
              Enable deposits, withdrawals, and trading
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⚖️</Text>
            <Text style={styles.infoText}>
              Comply with financial regulations
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      {status !== 'verified' && nextStep && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    fontSize: 22,
    color: '#fff',
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'right',
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  stepCardActive: {
    borderColor: MeruTheme.colors.accent.primary,
    backgroundColor: 'rgba(240, 180, 41, 0.05)',
  },
  stepCardCompleted: {
    opacity: 0.7,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MeruTheme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberCompleted: {
    backgroundColor: '#22c55e',
  },
  stepNumberActive: {
    backgroundColor: MeruTheme.colors.accent.primary,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  stepNumberTextActive: {
    color: MeruTheme.colors.background.primary,
  },
  stepCheckmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    marginLeft: 14,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 2,
  },
  stepTitleCompleted: {
    textDecorationLine: 'line-through',
    color: MeruTheme.colors.text.secondary,
  },
  stepDescription: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
  },
  stepChevron: {
    fontSize: 24,
    color: MeruTheme.colors.text.tertiary,
  },
  infoSection: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },
});
