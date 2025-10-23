import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Mail, Clock, Search, RefreshCw, Building } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MessagingService, Conversation, Message } from '../../services/messagingService';
import { BusinessService } from '../../services/business';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const Messages: React.FC = () => {
  const { userData } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [businesses, setBusinesses] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (userData?.role === 'admin') {
      loadConversations();
      loadBusinesses();
    }
  }, [userData]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.businessId, selectedConversation.customerId);
      // Mark messages as read when conversation is selected
      MessagingService.markMessagesAsRead(selectedConversation.businessId, selectedConversation.customerId, 'admin');
    }
  }, [selectedConversation]);

  const loadBusinesses = async () => {
    try {
      const businessesList = await BusinessService.getAllBusinesses();
      const businessesMap = businessesList.reduce((acc, business) => {
        acc[business.id] = business;
        return acc;
      }, {} as {[key: string]: any});
      setBusinesses(businessesMap);
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadConversations = async () => {
    if (userData?.role !== 'admin') return;

    try {
      setLoading(true);
      const convos = await MessagingService.getAllConversations();
      setConversations(convos);

      // Calculate total unread count
      const totalUnread = convos.reduce((sum, convo) => sum + convo.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (businessId: string, customerId: string) => {
    try {
      const msgs = await MessagingService.getAllCustomerMessages(businessId, customerId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const business = businesses[selectedConversation.businessId];
      
      await MessagingService.sendMessageToCustomer(
        selectedConversation.businessId,
        selectedConversation.customerId,
        newMessage.trim(),
        'admin',
        business?.name || 'Store Admin',
        business?.email || ''
      );

      setNewMessage('');
      // Reload messages
      await loadMessages(selectedConversation.businessId, selectedConversation.customerId);
      // Reload conversations to update last message
      await loadConversations();

      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(convo =>
    convo.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (businesses[convo.businessId]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2" />
            Messages
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-gray-600">Communicate with your customers</p>
        </div>
        <Button onClick={loadConversations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Messages from customers will appear here</p>
                </div>
              ) : (
                filteredConversations.map((convo) => (
                  <div
                    key={`${convo.businessId}-${convo.customerId}`}
                    onClick={() => setSelectedConversation(convo)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedConversation?.customerId === convo.customerId && selectedConversation?.businessId === convo.businessId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="font-medium text-gray-900 truncate">
                            {convo.customerName}
                          </p>
                          {convo.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                          <Building className="h-3 w-3" />
                          <span className="truncate">
                            {businesses[convo.businessId]?.name || 'Unknown Business'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {convo.customerEmail}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {convo.lastMessage.message}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {convo.lastMessage.createdAt.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Messages Panel */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="p-0 h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedConversation.customerName}</h3>
                    <p className="text-sm text-gray-500">{selectedConversation.customerEmail}</p>
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <Building className="h-3 w-3 mr-1" />
                      {businesses[selectedConversation.businessId]?.name || 'Unknown Business'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'admin'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.createdAt.toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center h-[600px] flex items-center justify-center">
              <div>
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a customer from the list to view messages</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};