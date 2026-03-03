import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon, DocumentAttachmentIcon } from '@hugeicons/core-free-icons';
import { OutreachHub } from './sme-outreach/OutreachHub';
import { SMERoster } from './sme-outreach/SMERoster';
import { TemplateManagerPanel } from './sme-outreach/TemplateManagerPanel';
import { POINT_PEOPLE, SME_STATUSES, initialSmes, initialTemplates } from '../utils/smeOutreachMockData';
import { parseSmeTemplate } from '../utils/smeTemplateParser';

const SME_STORAGE_KEY = 'krisban_sme_roster_v1';
const TEMPLATE_STORAGE_KEY = 'krisban_sme_templates_v1';

const getStoredArray = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const emptySmeForm = {
  name: '',
  title: '',
  organization: '',
  pointPerson: POINT_PEOPLE[0],
  status: SME_STATUSES[0],
  lastContactDate: '',
  notes: ''
};

const emptyTemplateForm = {
  templateName: '',
  content: ''
};

export const SMEOutreachView = () => {
  const [smes, setSmes] = useState(() => getStoredArray(SME_STORAGE_KEY, initialSmes));
  const [templates, setTemplates] = useState(() => getStoredArray(TEMPLATE_STORAGE_KEY, initialTemplates));
  const [selectedSmeId, setSelectedSmeId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');
  const [showSmeForm, setShowSmeForm] = useState(false);
  const [editingSmeId, setEditingSmeId] = useState(null);
  const [smeForm, setSmeForm] = useState(emptySmeForm);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [activeTab, setActiveTab] = useState('outreach');

  useEffect(() => {
    localStorage.setItem(SME_STORAGE_KEY, JSON.stringify(smes));
  }, [smes]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const selectedSme = useMemo(
    () => smes.find((sme) => sme.id === selectedSmeId) || null,
    [smes, selectedSmeId]
  );

  useEffect(() => {
    if (!selectedSmeId) return;
    const exists = smes.some((sme) => sme.id === selectedSmeId);
    if (!exists) {
      setSelectedSmeId(null);
      setSelectedTemplateId('');
      setDraftMessage('');
    }
  }, [smes, selectedSmeId]);

  const handleSelectSme = (smeId) => {
    setSelectedSmeId(smeId);
    setSelectedTemplateId('');
    setDraftMessage('');
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);

    if (!templateId || !selectedSme) {
      setDraftMessage('');
      return;
    }

    const template = templates.find((item) => item.id === templateId);
    const parsedContent = parseSmeTemplate({
      templateContent: template?.content || '',
      sme: selectedSme
    });

    setDraftMessage(parsedContent);
  };

  const handleStatusChange = (status) => {
    if (!selectedSme) return;

    setSmes((current) =>
      current.map((sme) => (sme.id === selectedSme.id ? { ...sme, status } : sme))
    );
  };

  const handleCopy = async () => {
    if (!draftMessage.trim()) return;

    try {
      await navigator.clipboard.writeText(draftMessage);
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy to Clipboard'), 1600);
    } catch (error) {
      setCopyButtonText('Copy Failed');
      setTimeout(() => setCopyButtonText('Copy to Clipboard'), 1600);
      console.error('Clipboard copy failed:', error);
    }
  };

  const startAddSme = () => {
    setEditingSmeId(null);
    setSmeForm(emptySmeForm);
    setShowSmeForm(true);
  };

  const startEditSme = (sme) => {
    setEditingSmeId(sme.id);
    setSmeForm({
      name: sme.name || '',
      title: sme.title || '',
      organization: sme.organization || '',
      pointPerson: sme.pointPerson || POINT_PEOPLE[0],
      status: sme.status || SME_STATUSES[0],
      lastContactDate: sme.lastContactDate || '',
      notes: sme.notes || ''
    });
    setShowSmeForm(true);
  };

  const handleSaveSme = (event) => {
    event.preventDefault();

    if (!smeForm.name.trim() || !smeForm.title.trim() || !smeForm.organization.trim()) {
      return;
    }

    if (editingSmeId) {
      setSmes((current) =>
        current.map((sme) => (sme.id === editingSmeId ? { ...sme, ...smeForm } : sme))
      );
    } else {
      const newSme = {
        id: `sme-${Date.now()}`,
        ...smeForm
      };
      setSmes((current) => [newSme, ...current]);
      setSelectedSmeId(newSme.id);
    }

    setShowSmeForm(false);
    setEditingSmeId(null);
    setSmeForm(emptySmeForm);
  };

  const handleDeleteSme = (id) => {
    setSmes((current) => current.filter((sme) => sme.id !== id));

    if (selectedSmeId === id) {
      setSelectedSmeId(null);
      setSelectedTemplateId('');
      setDraftMessage('');
    }
  };

  const startAddTemplate = () => {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
    setIsEditingTemplate(true);
    setActiveTab('templates');
  };

  const startEditTemplate = (template) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      templateName: template.templateName || '',
      content: template.content || ''
    });
    setIsEditingTemplate(true);
    setActiveTab('templates');
  };

  const handleSaveTemplate = (event) => {
    event.preventDefault();

    if (!templateForm.templateName.trim() || !templateForm.content.trim()) {
      return;
    }

    if (editingTemplateId) {
      setTemplates((current) =>
        current.map((template) =>
          template.id === editingTemplateId ? { ...template, ...templateForm } : template
        )
      );
    } else {
      const newTemplate = {
        id: `template-${Date.now()}`,
        ...templateForm
      };
      setTemplates((current) => [newTemplate, ...current]);
      setSelectedTemplateId(newTemplate.id);
      if (selectedSme) {
        const parsedContent = parseSmeTemplate({
          templateContent: newTemplate.content,
          sme: selectedSme
        });
        setDraftMessage(parsedContent);
      }
    }

    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
    setIsEditingTemplate(false);
  };

  const handleDeleteTemplate = (id) => {
    setTemplates((current) => current.filter((template) => template.id !== id));

    if (selectedTemplateId === id) {
      setSelectedTemplateId('');
      setDraftMessage('');
    }
  };

  const closeOutreachModal = () => {
    setSelectedSmeId(null);
    setSelectedTemplateId('');
    setDraftMessage('');
  };

  const cancelTemplateEdit = () => {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
    setIsEditingTemplate(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal">Emails CRM</h1>
        <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
          Track SME outreach, draft template-based messages, and update communication status.
        </p>
      </header>

      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('outreach')}
            className={`inline-flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'outreach'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-700 hover:text-slate-800'
            }`}
          >
            <HugeiconsIcon icon={BubbleChatIcon} size={18} color="currentColor" />
            Outreach
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`inline-flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'templates'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-700 hover:text-slate-800'
            }`}
          >
            <HugeiconsIcon icon={DocumentAttachmentIcon} size={18} color="currentColor" />
            Template Manager
          </button>
        </div>
      </div>

      {showSmeForm && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {editingSmeId ? 'Edit SME' : 'Add SME'}
          </h2>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSaveSme}>
            <input
              type="text"
              value={smeForm.name}
              onChange={(event) => setSmeForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="SME Name"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
              required
            />
            <input
              type="text"
              value={smeForm.title}
              onChange={(event) => setSmeForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
              required
            />
            <input
              type="text"
              value={smeForm.organization}
              onChange={(event) => setSmeForm((current) => ({ ...current, organization: event.target.value }))}
              placeholder="Organization"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
              required
            />
            <input
              type="date"
              value={smeForm.lastContactDate}
              onChange={(event) => setSmeForm((current) => ({ ...current, lastContactDate: event.target.value }))}
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
            <select
              value={smeForm.pointPerson}
              onChange={(event) => setSmeForm((current) => ({ ...current, pointPerson: event.target.value }))}
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            >
              {POINT_PEOPLE.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
            <select
              value={smeForm.status}
              onChange={(event) => setSmeForm((current) => ({ ...current, status: event.target.value }))}
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            >
              {SME_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <textarea
              value={smeForm.notes}
              onChange={(event) => setSmeForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes"
              rows={3}
              className="md:col-span-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-slate-50 hover:bg-emerald-700"
              >
                {editingSmeId ? 'Save SME' : 'Add SME'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSmeForm(false);
                  setEditingSmeId(null);
                  setSmeForm(emptySmeForm);
                }}
                className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'outreach' && (
        <div className="space-y-6">
          <SMERoster
            smes={smes}
            selectedSmeId={selectedSmeId}
            onSelectSme={handleSelectSme}
            onStartAddSme={startAddSme}
            onStartEditSme={startEditSme}
            onDeleteSme={handleDeleteSme}
          />

          {selectedSme && (
            <div className="lg:hidden">
              <OutreachHub
                selectedSme={selectedSme}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                draftMessage={draftMessage}
                copyButtonText={copyButtonText}
                onTemplateSelect={handleTemplateSelect}
                onDraftChange={setDraftMessage}
                onCopy={handleCopy}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <TemplateManagerPanel
          templates={templates}
          editingTemplateId={editingTemplateId}
          templateForm={templateForm}
          isEditingTemplate={isEditingTemplate}
          onTemplateFormChange={setTemplateForm}
          onSaveTemplate={handleSaveTemplate}
          onCancelTemplateEdit={cancelTemplateEdit}
          onStartTemplateCreate={startAddTemplate}
          onStartTemplateEdit={startEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      )}

      {activeTab === 'outreach' && selectedSme && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center bg-slate-800/40 p-6">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close email details"
            onClick={closeOutreachModal}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeOutreachModal}
              className="absolute right-3 top-3 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>

            <OutreachHub
              selectedSme={selectedSme}
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              draftMessage={draftMessage}
              copyButtonText={copyButtonText}
              onTemplateSelect={handleTemplateSelect}
              onDraftChange={setDraftMessage}
              onCopy={handleCopy}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};