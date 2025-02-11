"use client";

import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { AutomationType, AUTOMATION_TEMPLATES } from '@/types/automation';
import { fetchWithAuth } from '@/lib/utils/api';

interface NewRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: any) => void;
  type: AutomationType;
}

interface Condition {
  field: string;
  operator: string;
  value: string | number;
}

interface Action {
  type: string;
  params: Record<string, any>;
}

// Koşul alanları için seçenekler
const CONDITION_FIELDS = {
  matching: [
    { value: 'utm_source', label: 'UTM Source' },
    { value: 'campaign_id', label: 'Campaign ID' },
    { value: 'campaign_name', label: 'Campaign Name' }
  ],
  trigger: [
    { value: 'roi', label: 'ROI' },
    { value: 'spend', label: 'Spend' },
    { value: 'leads', label: 'Leads' },
    { value: 'revenue', label: 'Revenue' }
  ],
  workflow: [
    { value: 'deal_stage', label: 'Deal Stage' },
    { value: 'deal_amount', label: 'Deal Amount' },
    { value: 'deal_probability', label: 'Deal Probability' }
  ],
  sync: [
    { value: 'last_sync', label: 'Last Sync Time' },
    { value: 'sync_status', label: 'Sync Status' }
  ]
};

// Operatör seçenekleri
const OPERATORS = [
  { value: '==', label: 'Equals' },
  { value: '!=', label: 'Not Equals' },
  { value: '>', label: 'Greater Than' },
  { value: '>=', label: 'Greater Than or Equal' },
  { value: '<', label: 'Less Than' },
  { value: '<=', label: 'Less Than or Equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' }
];

// Aksiyon tipleri
const ACTION_TYPES = {
  matching: [
    { value: 'create_deal', label: 'Create Deal' },
    { value: 'update_deal', label: 'Update Deal' },
    { value: 'link_campaign', label: 'Link Campaign' }
  ],
  trigger: [
    { value: 'create_notification', label: 'Create Notification' },
    { value: 'update_campaign', label: 'Update Campaign Status' },
    { value: 'send_email', label: 'Send Email' }
  ],
  workflow: [
    { value: 'update_deal_stage', label: 'Update Deal Stage' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'send_slack', label: 'Send Slack Message' }
  ],
  sync: [
    { value: 'sync_campaigns', label: 'Sync Campaigns' },
    { value: 'sync_deals', label: 'Sync Deals' },
    { value: 'sync_contacts', label: 'Sync Contacts' }
  ]
};

export default function NewRuleModal({ isOpen, onClose, onSave, type }: NewRuleModalProps) {
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([{ field: '', operator: '', value: '' }]);
  const [actions, setActions] = useState<Action[]>([{ type: '', params: {} }]);
  const [template, setTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template seçildiğinde
  const handleTemplateChange = (templateName: string) => {
    setTemplate(templateName);
    const selectedTemplate = AUTOMATION_TEMPLATES[type].find(t => t.name === templateName);
    if (selectedTemplate) {
      setConditions(selectedTemplate.conditions);
      setActions(selectedTemplate.actions);
    }
  };

  // Koşul değişikliklerini yönet
  const handleConditionChange = (index: number, field: string, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  // Aksiyon değişikliklerini yönet
  const handleActionChange = (index: number, field: string, value: string) => {
    const newActions = [...actions];
    if (field === 'type') {
      newActions[index] = { type: value, params: {} };
    } else {
      newActions[index] = { ...newActions[index], params: { ...newActions[index].params, [field]: value } };
    }
    setActions(newActions);
  };

  // Kuralı kaydet
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!name || conditions.some(c => !c.field || !c.operator || !c.value) || 
          actions.some(a => !a.type)) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetchWithAuth('/api/hubspot/automation/rules', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          conditions,
          actions
        })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      onSave(response.data);
      onClose();
      
      // Form'u sıfırla
      setName('');
      setConditions([{ field: '', operator: '', value: '' }]);
      setActions([{ type: '', params: {} }]);
      setTemplate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">New {type.charAt(0).toUpperCase() + type.slice(1)} Rule</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Template Seçimi */}
          <div>
            <label className="block text-sm font-medium mb-2">Use Template</label>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a template...</option>
              {AUTOMATION_TEMPLATES[type].map((t, index) => (
                <option key={index} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter rule name"
            />
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium mb-2">Conditions</label>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={condition.field}
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select field...</option>
                    {CONDITION_FIELDS[type].map((field, i) => (
                      <option key={i} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select operator...</option>
                    {OPERATORS.map((op, i) => (
                      <option key={i} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter value"
                  />
                  <button
                    onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setConditions([...conditions, { field: '', operator: '', value: '' }])}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Condition
              </button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium mb-2">Actions</label>
            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={action.type}
                    onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select action...</option>
                    {ACTION_TYPES[type].map((act, i) => (
                      <option key={i} value={act.value}>{act.label}</option>
                    ))}
                  </select>
                  {action.type && (
                    <div className="flex-1">
                      {/* Aksiyon tipine göre özel parametreler */}
                      {action.type === 'create_notification' && (
                        <input
                          type="text"
                          value={action.params.message || ''}
                          onChange={(e) => handleActionChange(index, 'message', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Notification message"
                        />
                      )}
                      {action.type === 'update_campaign' && (
                        <select
                          value={action.params.status || ''}
                          onChange={(e) => handleActionChange(index, 'status', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select status...</option>
                          <option value="ACTIVE">Active</option>
                          <option value="PAUSED">Paused</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setActions(actions.filter((_, i) => i !== index))}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setActions([...actions, { type: '', params: {} }])}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Action
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !name || conditions.some(c => !c.field || !c.operator || !c.value) || 
                     actions.some(a => !a.type)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </div>
    </div>
  );
} 