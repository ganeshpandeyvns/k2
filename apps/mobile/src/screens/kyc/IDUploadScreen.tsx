// ============================================================================
// ID Upload Screen - KYC Document Capture
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { useKYCStore } from '../../store/kycStore';
import { documentTypes } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DocumentType = 'passport' | 'drivers_license' | 'id_card';

export const IDUploadScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addDocument, setSelfie, simulateVerification, documents, selfieUri } = useKYCStore();

  const [selectedType, setSelectedType] = useState<DocumentType>('drivers_license');
  const [frontImage, setFrontImage] = useState<string | null>(
    documents.find(d => d.type === selectedType)?.frontUri || null
  );
  const [backImage, setBackImage] = useState<string | null>(
    documents.find(d => d.type === selectedType)?.backUri || null
  );
  const [selfieImage, setSelfieImage] = useState<string | null>(selfieUri);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const selectedDocType = documentTypes.find(d => d.id === selectedType);
  const requiresBack = selectedDocType?.requiresBack ?? false;

  const isComplete = frontImage && (!requiresBack || backImage) && selfieImage;

  const pickImage = async (side: 'front' | 'back' | 'selfie') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: side === 'selfie' ? [1, 1] : [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = result.assets[0].uri;

      if (side === 'front') {
        setFrontImage(uri);
      } else if (side === 'back') {
        setBackImage(uri);
      } else {
        setSelfieImage(uri);
      }
    }
  };

  const handleContinue = async () => {
    if (!isComplete) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);

    // Save document
    addDocument({
      type: selectedType,
      frontUri: frontImage!,
      backUri: backImage || undefined,
      uploadedAt: new Date().toISOString(),
    });

    // Save selfie
    setSelfie(selfieImage!);

    // Simulate verification
    await simulateVerification();

    setIsProcessing(false);
    setVerificationComplete(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate back after success
    setTimeout(() => {
      navigation.navigate('KYC' as any);
    }, 1500);
  };

  if (verificationComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Verification Complete!</Text>
          <Text style={styles.successSubtitle}>
            Your identity has been verified successfully
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Identity Document</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>

        {/* Document Type Selection */}
        <Text style={styles.sectionLabel}>Document Type</Text>
        <View style={styles.docTypeContainer}>
          {documentTypes.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[
                styles.docTypeButton,
                selectedType === doc.id && styles.docTypeButtonActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedType(doc.id as DocumentType);
                setFrontImage(null);
                setBackImage(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.docTypeText,
                  selectedType === doc.id && styles.docTypeTextActive,
                ]}
              >
                {doc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Front of Document */}
        <Text style={styles.sectionLabel}>
          {selectedType === 'passport' ? 'Photo Page' : 'Front of ID'}
        </Text>
        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => pickImage('front')}
          activeOpacity={0.7}
        >
          {frontImage ? (
            <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <Text style={styles.uploadIconText}>📷</Text>
              </View>
              <Text style={styles.uploadText}>Tap to upload</Text>
              <Text style={styles.uploadHint}>
                Clear photo with all corners visible
              </Text>
            </>
          )}
          {frontImage && (
            <View style={styles.uploadedBadge}>
              <Text style={styles.uploadedBadgeText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Back of Document (if required) */}
        {requiresBack && (
          <>
            <Text style={styles.sectionLabel}>Back of ID</Text>
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={() => pickImage('back')}
              activeOpacity={0.7}
            >
              {backImage ? (
                <Image source={{ uri: backImage }} style={styles.uploadedImage} />
              ) : (
                <>
                  <View style={styles.uploadIcon}>
                    <Text style={styles.uploadIconText}>📷</Text>
                  </View>
                  <Text style={styles.uploadText}>Tap to upload</Text>
                  <Text style={styles.uploadHint}>
                    Include barcode if present
                  </Text>
                </>
              )}
              {backImage && (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Selfie */}
        <Text style={styles.sectionLabel}>Selfie Verification</Text>
        <TouchableOpacity
          style={[styles.uploadCard, styles.selfieCard]}
          onPress={() => pickImage('selfie')}
          activeOpacity={0.7}
        >
          {selfieImage ? (
            <Image source={{ uri: selfieImage }} style={styles.selfieImage} />
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <Text style={styles.uploadIconText}>🤳</Text>
              </View>
              <Text style={styles.uploadText}>Take a selfie</Text>
              <Text style={styles.uploadHint}>
                Face the camera directly with good lighting
              </Text>
            </>
          )}
          {selfieImage && (
            <View style={styles.uploadedBadge}>
              <Text style={styles.uploadedBadgeText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            Demo Mode: Any image will be accepted for verification
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!isComplete || isProcessing) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isComplete || isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isComplete && !isProcessing
                ? [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
                : ['#3a3a3a', '#2a2a2a']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color={MeruTheme.colors.background.primary} />
                <Text style={styles.processingText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>Verify Identity</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 24,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 14,
    color: MeruTheme.colors.accent.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 12,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  docTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  docTypeButtonActive: {
    borderColor: MeruTheme.colors.accent.primary,
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
  },
  docTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
  },
  docTypeTextActive: {
    color: MeruTheme.colors.accent.primary,
  },
  uploadCard: {
    height: 160,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: MeruTheme.colors.border.subtle,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  selfieCard: {
    height: 200,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedBadgeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(240, 180, 41, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIconText: {
    fontSize: 28,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: MeruTheme.colors.text.tertiary,
  },
  demoNotice: {
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  demoNoticeText: {
    fontSize: 13,
    color: MeruTheme.colors.accent.primary,
    textAlign: 'center',
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
  continueButtonDisabled: {
    shadowOpacity: 0,
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
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.background.primary,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: '#fff',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
  },
});
