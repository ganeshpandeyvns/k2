// ============================================================================
// Advisor Chat Screen - AI Financial Assistant with Guardrails
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../hooks/useTheme';
import { useAIAdvisorStore, ChatMessage, QueryCategory } from '../../store/aiAdvisorStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Message Bubble Component
const MessageBubble: React.FC<{ message: ChatMessage; theme: ReturnType<typeof useTheme>['theme'] }> = ({ message, theme }) => {
  const isUser = message.role === 'user';

  const getCategoryBadge = (category?: QueryCategory) => {
    if (!category || category === 'blocked' || category === 'off-topic') return null;

    const labels: Record<QueryCategory, string> = {
      'portfolio-analysis': 'Portfolio',
      'market-insight': 'Markets',
      'investment-education': 'Education',
      'product-info': 'Product Info',
      'risk-assessment': 'Risk',
      'blocked': '',
      'off-topic': '',
    };

    return labels[category] ? (
      <View style={[styles.categoryBadge, { backgroundColor: theme.colors.background.tertiary }]}>
        <Text style={[styles.categoryBadgeText, { color: theme.colors.text.secondary }]}>{labels[category]}</Text>
      </View>
    ) : null;
  };

  return (
    <View style={[styles.messageBubbleContainer, isUser && styles.userMessageContainer]}>
      {!isUser && (
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.accent.primary }]}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={styles.messageContent}>
        <View style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.colors.accent.primary }]
            : [styles.assistantBubble, { backgroundColor: theme.colors.background.secondary }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : theme.colors.text.primary }
          ]}>
            {message.content}
          </Text>
        </View>
        {!isUser && message.category && getCategoryBadge(message.category)}
        {message.disclaimer && (
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerIcon}>i</Text>
            <Text style={[styles.disclaimerText, { color: theme.colors.text.secondary }]}>{message.disclaimer}</Text>
          </View>
        )}
        <Text style={[styles.timestamp, { color: theme.colors.text.tertiary }]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

// Typing Indicator
const TypingIndicator: React.FC<{ theme: ReturnType<typeof useTheme>['theme'] }> = ({ theme }) => (
  <View style={styles.typingContainer}>
    <View style={[styles.avatarContainer, { backgroundColor: theme.colors.accent.primary }]}>
      <Text style={styles.avatarText}>AI</Text>
    </View>
    <View style={[styles.typingBubble, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={styles.typingDots}>
        <View style={[styles.dot, styles.dot1, { backgroundColor: theme.colors.text.tertiary }]} />
        <View style={[styles.dot, styles.dot2, { backgroundColor: theme.colors.text.tertiary }]} />
        <View style={[styles.dot, styles.dot3, { backgroundColor: theme.colors.text.tertiary }]} />
      </View>
    </View>
  </View>
);

// Suggested Questions
const SuggestedQuestions: React.FC<{ onSelect: (q: string) => void; theme: ReturnType<typeof useTheme>['theme'] }> = ({ onSelect, theme }) => {
  const questions = [
    'How diversified is my portfolio?',
    'What are treasury bonds?',
    'Should I add fixed income?',
    'Explain market volatility',
  ];

  return (
    <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.background.secondary }]}>
      <Text style={[styles.suggestionsLabel, { color: theme.colors.text.secondary }]}>Try asking:</Text>
      <View style={styles.suggestionsGrid}>
        {questions.map((q, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionChip, {
              backgroundColor: theme.colors.background.tertiary,
              borderColor: theme.colors.border.subtle
            }]}
            onPress={() => onSelect(q)}
          >
            <Text style={[styles.suggestionText, { color: theme.colors.text.primary }]}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export function AdvisorChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();

  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const {
    messages,
    isTyping,
    hasAcceptedDisclaimer,
    generateResponse,
    startSession,
    acceptDisclaimer,
    clearHistory,
  } = useAIAdvisorStore();

  // Determine status bar style based on theme
  const isDarkTheme = theme.colors.background.primary === '#0A0A0A' ||
    theme.colors.background.primary === '#000000' ||
    theme.colors.background.primary.toLowerCase().includes('0a');

  // Initialize session on mount
  useEffect(() => {
    startSession();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const query = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    await generateResponse(query);
  };

  const handleSuggestionSelect = (question: string) => {
    setInputText(question);
  };

  // Disclaimer modal
  if (!hasAcceptedDisclaimer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={[styles.disclaimerModal, { backgroundColor: theme.colors.background.primary }]}>
          <View style={[styles.disclaimerCard, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.disclaimerTitle, { color: theme.colors.text.primary }]}>AI Financial Advisor</Text>
            <Text style={[styles.disclaimerSubtitle, { color: theme.colors.text.secondary }]}>Important Information</Text>

            <View style={styles.disclaimerContent}>
              <Text style={[styles.disclaimerPoint, { color: theme.colors.text.secondary, borderLeftColor: theme.colors.accent.primary }]}>
                This AI advisor provides educational information and general guidance only.
              </Text>
              <Text style={[styles.disclaimerPoint, { color: theme.colors.text.secondary, borderLeftColor: theme.colors.accent.primary }]}>
                Nothing shared here constitutes personalized financial advice.
              </Text>
              <Text style={[styles.disclaimerPoint, { color: theme.colors.text.secondary, borderLeftColor: theme.colors.accent.primary }]}>
                Always consult a licensed financial professional before making investment decisions.
              </Text>
              <Text style={[styles.disclaimerPoint, { color: theme.colors.text.secondary, borderLeftColor: theme.colors.accent.primary }]}>
                Past performance does not guarantee future results.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: theme.colors.accent.primary }]}
              onPress={acceptDisclaimer}
            >
              <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.declineButtonText, { color: theme.colors.text.secondary }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Meru Advisor</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.success.primary }]} />
              <Text style={[styles.statusText, { color: theme.colors.text.tertiary }]}>AI Powered</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={clearHistory}>
            <Text style={[styles.clearText, { color: theme.colors.accent.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} theme={theme} />
          ))}

          {isTyping && <TypingIndicator theme={theme} />}

          {messages.length <= 1 && !isTyping && (
            <SuggestedQuestions onSelect={handleSuggestionSelect} theme={theme} />
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[
          styles.inputArea,
          {
            borderTopColor: theme.colors.border.subtle,
            backgroundColor: theme.colors.background.primary
          },
          keyboardHeight > 0 && { paddingBottom: 8 }
        ]}>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.background.secondary }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text.primary }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your portfolio..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.colors.accent.primary },
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.inputDisclaimer, { color: theme.colors.text.tertiary }]}>
            AI responses are for educational purposes only
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  clearText: {
    fontSize: 14,
    textAlign: 'right',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
    maxWidth: '85%',
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(74, 144, 217, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
  },
  disclaimerIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A90D9',
    marginRight: 8,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingBubble: {
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.5,
  },
  dot3: {
    opacity: 0.7,
  },
  suggestionsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputArea: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputDisclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  // Disclaimer Modal Styles
  disclaimerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  disclaimerCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  disclaimerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  disclaimerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  disclaimerContent: {
    marginBottom: 24,
  },
  disclaimerPoint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
  },
  acceptButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 15,
  },
});
