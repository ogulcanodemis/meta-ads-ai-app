"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight, Mail, X, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, List, ListOrdered, Heading } from 'lucide-react';
import dynamic from 'next/dynamic';

interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  lifecycleStage?: string;
  lastActivity?: string;
}

const ITEMS_PER_PAGE = 10;

// Email templates
const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Our Platform',
    content: `
      <h2>Welcome!</h2>
      <p>We're excited to have you on board.</p>
      <p>Here are some key features you might want to explore:</p>
      <ul>
        <li>Feature 1</li>
        <li>Feature 2</li>
        <li>Feature 3</li>
      </ul>
      <p>Best regards,<br>[Your Name]</p>
    `
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    subject: 'Your Monthly Update',
    content: `
      <h2>Monthly Newsletter</h2>
      <p>Here's what's new this month:</p>
      <ul>
        <li>Update 1</li>
        <li>Update 2</li>
        <li>Update 3</li>
      </ul>
      <p>Stay tuned for more updates!</p>
    `
  },
  {
    id: 'promotion',
    name: 'Special Offer',
    subject: 'Special Offer Just for You',
    content: `
      <h2>Special Offer!</h2>
      <p>We have an exclusive offer for you:</p>
      <div style="padding: 15px; background-color: #f8f9fa; border-radius: 5px; margin: 10px 0;">
        <h3 style="color: #2563eb;">Limited Time Offer</h3>
        <p>Don't miss out on this opportunity!</p>
      </div>
      <p>Offer ends soon.</p>
    `
  }
];

// Custom Tiptap MenuBar component
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white dark:bg-gray-800">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <Heading className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Enter the URL:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
          editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Enter the image URL:')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

const EditorContent = dynamic(() => import('@tiptap/react').then(mod => mod.EditorContent), {
  ssr: false,
});

export default function HubspotContacts() {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: emailContent,
    onUpdate: ({ editor }) => {
      setEmailContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
  });

  // Update useEffect to handle editor content updates
  useEffect(() => {
    if (editor && emailContent && editor.getHTML() !== emailContent) {
      editor.commands.setContent(emailContent);
    }
  }, [emailContent, editor]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/hubspot/contacts');
      
      if (response.error) {
        throw new Error(response.error);
      }

      setContacts(response.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const syncContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/hubspot/sync', {
        method: 'POST'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      await fetchContacts();
    } catch (err) {
      console.error('Error syncing contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const searchString = searchTerm.toLowerCase();
    return (
      contact.email?.toLowerCase().includes(searchString) ||
      contact.firstName?.toLowerCase().includes(searchString) ||
      contact.lastName?.toLowerCase().includes(searchString) ||
      contact.company?.toLowerCase().includes(searchString)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true);
      const response = await fetchWithAuth('/api/hubspot/contacts/send-email', {
        method: 'POST',
        body: JSON.stringify({
          contactIds: selectedContacts,
          subject: emailSubject,
          content: emailContent
        })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Reset selections and close modal
      setSelectedContacts([]);
      setEmailSubject('');
      setEmailContent('');
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error('Error sending emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Update handleTemplateSelect to also update editor content
  const handleTemplateSelect = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailContent(template.content);
      setSelectedTemplate(templateId);
      editor?.commands.setContent(template.content);
    }
  };

  // Add this function to handle preview mode
  const togglePreviewMode = () => {
    if (!previewMode) {
      // Get first 5 recipients for preview
      const previewRecipients = contacts
        .filter(contact => selectedContacts.includes(contact.id))
        .slice(0, 5)
        .map(contact => contact.email);
      setRecipientPreview(previewRecipients);
    }
    setPreviewMode(!previewMode);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">HubSpot Contacts</h1>
        <div className="flex gap-3">
          <button
            onClick={syncContacts}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Contacts'}
          </button>
          {selectedContacts.length > 0 && (
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email ({selectedContacts.length})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => {}}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lifecycle Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : currentContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No contacts found matching your search.' : 'No contacts found. Sync with HubSpot to import contacts.'}
                  </td>
                </tr>
              ) : (
                currentContacts.map((contact) => (
                  <tr key={contact.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{contact.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{contact.company || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{contact.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {contact.lifecycleStage || 'New'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {contact.lastActivity || 'No activity'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {}}
                        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredContacts.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} results
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold">Send Email to Selected Contacts</h2>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Template</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {EMAIL_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`p-4 border rounded-lg text-left hover:border-blue-500 transition-colors ${
                        selectedTemplate === template.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter email subject"
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Content</label>
                  <button
                    onClick={togglePreviewMode}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                </div>
                
                {previewMode ? (
                  <div className="border rounded-lg p-6 bg-white dark:bg-gray-700">
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">Preview Recipients:</p>
                      {recipientPreview.map(email => (
                        <div key={email} className="text-sm">{email}</div>
                      ))}
                      {selectedContacts.length > 5 && (
                        <div className="text-sm text-gray-500 mt-1">
                          and {selectedContacts.length - 5} more...
                        </div>
                      )}
                    </div>
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: emailContent }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 w-full">
                    <MenuBar editor={editor} />
                    <div className="prose prose-sm dark:prose-invert max-w-none w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <EditorContent editor={editor} className="min-h-[200px] p-4 focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* Recipients Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Recipients</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This email will be sent to {selectedContacts.length} selected contacts.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {isSendingEmail ? 'Sending email...' : 'Ready to send'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailSubject || !emailContent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 