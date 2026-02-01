// ============================================================================
// Personal Info Screen - KYC Step 1
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { useKYCStore, PersonalInfo } from '../../store/kycStore';
import { usStates } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { personalInfo, setPersonalInfo } = useKYCStore();

  const [firstName, setFirstName] = useState(personalInfo?.firstName || '');
  const [lastName, setLastName] = useState(personalInfo?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(personalInfo?.dateOfBirth || '');
  const [street, setStreet] = useState(personalInfo?.address?.street || '');
  const [city, setCity] = useState(personalInfo?.address?.city || '');
  const [state, setState] = useState(personalInfo?.address?.state || '');
  const [zipCode, setZipCode] = useState(personalInfo?.address?.zipCode || '');
  const [ssnLast4, setSsnLast4] = useState(personalInfo?.ssnLast4 || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid =
    firstName.length >= 2 &&
    lastName.length >= 2 &&
    dateOfBirth.length === 10 &&
    street.length >= 5 &&
    city.length >= 2 &&
    state.length === 2 &&
    zipCode.length === 5 &&
    ssnLast4.length === 4;

  const formatDateInput = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');

    // Format as MM/DD/YYYY
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
  };

  const handleDateChange = (text: string) => {
    setDateOfBirth(formatDateInput(text));
  };

  const handleZipChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 5);
    setZipCode(cleaned);
  };

  const handleSSNChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setSsnLast4(cleaned);
  };

  const handleStateChange = (text: string) => {
    setState(text.toUpperCase().slice(0, 2));
  };

  const handleContinue = () => {
    if (!isValid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const info: PersonalInfo = {
      firstName,
      lastName,
      dateOfBirth,
      address: {
        street,
        city,
        state,
        zipCode,
        country: 'US',
      },
      ssnLast4,
    };

    setPersonalInfo(info);
    navigation.navigate('IDUpload' as any);
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
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Step 1 of 3</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.field}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={MeruTheme.colors.text.tertiary}
                value={dateOfBirth}
                onChangeText={handleDateChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* Street Address */}
            <View style={styles.field}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main Street"
                placeholderTextColor={MeruTheme.colors.text.tertiary}
                value={street}
                onChangeText={setStreet}
                autoCapitalize="words"
              />
            </View>

            {/* City, State, ZIP */}
            <View style={styles.row}>
              <View style={styles.cityField}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New York"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.stateField}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="NY"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={state}
                  onChangeText={handleStateChange}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
              <View style={styles.zipField}>
                <Text style={styles.label}>ZIP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10001"
                  placeholderTextColor={MeruTheme.colors.text.tertiary}
                  value={zipCode}
                  onChangeText={handleZipChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            {/* SSN Last 4 */}
            <View style={styles.field}>
              <Text style={styles.label}>SSN (Last 4 digits)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor={MeruTheme.colors.text.tertiary}
                value={ssnLast4}
                onChangeText={handleSSNChange}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
              <Text style={styles.helperText}>
                Required for identity verification
              </Text>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Your information is encrypted and securely stored. We never share your data with third parties.
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isValid
                  ? [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
                  : ['#3a3a3a', '#2a2a2a']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
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
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
    gap: 8,
  },
  cityField: {
    flex: 2,
    gap: 8,
  },
  stateField: {
    flex: 1,
    gap: 8,
  },
  zipField: {
    flex: 1.2,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  input: {
    height: 52,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  privacyIcon: {
    fontSize: 18,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
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
});
