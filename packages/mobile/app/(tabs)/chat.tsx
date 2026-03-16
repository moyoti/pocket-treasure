import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { getConversations, getMessages, sendMessage, markMessagesAsRead, getFriends } from '@/api/social';
import { Conversation, Message, Friend } from '@/types';

export default function ChatScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ userId?: string; username?: string }>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeChat, setActiveChat] = useState<{
    userId: string;
    username: string;
    avatar?: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [conversationsData, friendsData] = await Promise.all([
        getConversations(),
        getFriends(),
      ]);
      setConversations(conversationsData);
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (params.userId && params.username && conversations.length >= 0) {
      handleOpenChat(params.userId, params.username, undefined);
    }
  }, [params.userId, params.username]);

  const handleOpenChat = async (userId: string, username: string, avatar?: string) => {
    setActiveChat({ userId, username, avatar });
    setLoadingMessages(true);
    setMessages([]);

    try {
      const messagesData = await getMessages(userId);
      setMessages(messagesData);
      await markMessagesAsRead(userId);
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === userId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleBack = () => {
    setActiveChat(null);
    setMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await sendMessage(activeChat.userId, content);
      setMessages((prev) => [...prev, sentMessage]);
      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === activeChat.userId);
        if (existing) {
          return [
            { ...existing, lastMessage: sentMessage },
            ...prev.filter((c) => c.userId !== activeChat.userId),
          ];
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleOpenChat(item.userId, item.username, item.avatar)}
      activeOpacity={0.6}
    >
      <View style={styles.conversationAvatar}>
        <Text style={styles.conversationAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.username}</Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        )}
      </View>
      {item.lastMessage && (
        <Text style={styles.conversationTime}>{formatTime(item.lastMessage.createdAt)}</Text>
      )}
    </TouchableOpacity>
  );

  const renderFriendButton = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendButton}
      onPress={() => handleOpenChat(item.id, item.username, item.avatar)}
      activeOpacity={0.7}
    >
      <View style={styles.friendButtonAvatar}>
        <Text style={styles.friendButtonAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
        {item.isOnline && <View style={styles.friendOnlineDot} />}
      </View>
      <Text style={styles.friendButtonName} numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  // Chat View
  if (activeChat) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>
                {activeChat.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.chatTitle}>{activeChat.username}</Text>
          </View>

          {/* Messages */}
          {loadingMessages ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#D4A017" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubble-outline" size={40} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Say hello to start the conversation!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#AAA"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons
                name="send"
                size={18}
                color={newMessage.trim() ? '#FFF' : '#CCC'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Conversation List View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Messages</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Online friends */}
      {friends.length > 0 && (
        <View style={styles.friendsSection}>
          <Text style={styles.friendsSectionTitle}>ONLINE</Text>
          <FlatList
            horizontal
            data={friends.slice(0, 10)}
            renderItem={renderFriendButton}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsList}
          />
        </View>
      )}

      {/* Conversations list */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={40} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with your friends!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.conversationsList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  // List header
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  listTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Chat header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  chatTitle: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '78%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#D4A017',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  ownMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: '#1A1A1A',
  },
  messageTime: {
    color: '#BBB',
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 4,
  },
  ownMessageTime: {
    textAlign: 'right',
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F4EC',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#1A1A1A',
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E8E0D0',
  },
  // Friends section
  friendsSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  friendsSectionTitle: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  friendsList: {
    paddingHorizontal: 16,
  },
  friendButton: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 60,
  },
  friendButtonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  friendButtonAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  friendOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#FFF8E7',
  },
  friendButtonName: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  // Conversations
  conversationsList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  conversationAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationName: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 15,
  },
  lastMessage: {
    color: '#999',
    fontSize: 13,
    marginTop: 3,
  },
  conversationTime: {
    color: '#BBB',
    fontSize: 11,
    marginLeft: 8,
  },
  // Empty / Loading
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
  },
});
