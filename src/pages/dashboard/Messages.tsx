import React, { useState, useEffect } from 'react';
import { ContactMessage, ContactMessageService } from '../../services/contactMessage';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  MessageSquare,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const Messages: React.FC = () => {
  const { business } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'read' | 'responded'>('all');

  console.log('Messages component render. Business:', business);

  useEffect(() => {
    console.log('Messages component mounted. Business data:', business);
    if (business?.id) {
      console.log('Loading messages for business:', business.id);
      loadMessages();
    } else {
      console.log('No business ID available. Business state:', business);
    }
  }, [business?.id]);

  const loadMessages = async () => {
    if (!business?.id) {
      console.log('Cannot load messages: no business ID');
      setError('Business ID is not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Loading messages for business ID:', business.id);
      setIsLoading(true);
      setError(null);
      const fetchedMessages = await ContactMessageService.getMessagesByBusinessId(business.id);
      console.log('Successfully loaded messages:', fetchedMessages.length);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId: string, status: ContactMessage['status']) => {
    try {
      await ContactMessageService.updateMessageStatus(messageId, status);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status, updatedAt: new Date() as any }
            : msg
        )
      );
      toast.success('Message status updated');
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await ContactMessageService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filterStatus === 'all') return true;
    return msg.status === filterStatus;
  });

  const getStatusIcon = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'read':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'responded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Conditional rendering AFTER all hooks
  if (!business) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business data...</p>
          <p className="text-xs text-gray-400 mt-2">If this takes too long, check browser console for errors</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Messages</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-red-500 bg-red-100 p-3 rounded-md">
            <p><strong>Debug Info:</strong></p>
            <p>Business ID: {business?.id || 'undefined'}</p>
            <p>Business Name: {business?.name || 'undefined'}</p>
          </div>
          <Button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              loadMessages();
            }}
            className="mt-4"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Customer inquiries from your contact form</p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Messages ({messages.length})</option>
            <option value="new">New ({messages.filter(m => m.status === 'new').length})</option>
            <option value="read">Read ({messages.filter(m => m.status === 'read').length})</option>
            <option value="responded">Responded ({messages.filter(m => m.status === 'responded').length})</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-gray-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-sm text-gray-600">Total Messages</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-red-600">{messages.filter(m => m.status === 'new').length}</p>
              <p className="text-sm text-gray-600">New Messages</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-blue-600">{messages.filter(m => m.status === 'read').length}</p>
              <p className="text-sm text-gray-600">Read</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-green-600">{messages.filter(m => m.status === 'responded').length}</p>
              <p className="text-sm text-gray-600">Responded</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
          <p className="text-gray-600">
            {filterStatus === 'all' 
              ? 'You haven\'t received any contact form submissions yet.'
              : `No messages with status "${filterStatus}" found.`
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredMessages.map((message) => (
            <Card key={message.id} className={`p-6 cursor-pointer transition-all hover:shadow-md ${
              message.status === 'new' ? 'ring-2 ring-red-200' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(message.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{message.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline">
                        {message.email}
                      </a>
                    </div>
                    
                    {message.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href={`tel:${message.phone}`} className="text-blue-600 hover:underline">
                          {message.phone}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">{message.subject}</h3>
                    <p className="text-gray-600 line-clamp-3">{message.message}</p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {message.status === 'new' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(message.id!, 'read')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Mark as Read
                    </Button>
                  )}
                  
                  {message.status !== 'responded' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(message.id!, 'responded')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Responded
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}`)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMessage(message.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};