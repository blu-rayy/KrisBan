import { useContext, useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon, DocumentAttachmentIcon } from '@hugeicons/core-free-icons';
import { OutreachHub } from './OutreachHub';
import { SMERoster } from './SMERoster';
import { TemplateManagerPanel } from './TemplateManagerPanel';
import { SME_STATUSES } from '../../utils/smeOutreachMockData';
import { parseSmeTemplate } from '../../utils/smeTemplateParser';
import { emailsCrmService } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const getEmailsCrmWarmBootCacheKey = (teamId) => `emailsCrmWarmBootCacheV1_team_${teamId ?? 'none'}`;

const loadWarmBootCache = (teamId) => {
  try {
    const raw = localStorage.getItem(getEmailsCrmWarmBootCacheKey(teamId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      smes: Array.isArray(parsed.smes) ? parsed.smes : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      pointPeople: Array.isArray(parsed.pointPeople) ? parsed.pointPeople : []
    };
  } catch (_error) {
    return null;
  }
};

const saveWarmBootCache = (teamId, { smes, templates, pointPeople }) => {
  try {
    localStorage.setItem(
      getEmailsCrmWarmBootCacheKey(teamId),
      JSON.stringify({
        smes: Array.isArray(smes) ? smes : [],
        templates: Array.isArray(templates) ? templates : [],
        pointPeople: Array.isArray(pointPeople) ? pointPeople : [],
        updatedAt: new Date().toISOString()
      })
    );
  } catch (_error) {
    // Ignore localStorage write errors
  }
};

const emptySmeForm = {
  name: '',
  title: '',
  organization: '',
  pointPersonUserId: '',
  pointPersonNameSnapshot: '',
  status: SME_STATUSES[0],
  lastContactDate: '',
  notes: '',
  profilePicture: '',
  summary: '',
  email: '',
  phone: '',
  linkedinUrl: ''
};

const emptyTemplateForm = {
  templateName: '',
  content: ''
};

export const SMEOutreachView = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;
  const [smes, setSmes] = useState([]);
  const [pointPeople, setPointPeople] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSmeId, setSelectedSmeId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSmeForm, setShowSmeForm] = useState(false);
  const [editingSmeId, setEditingSmeId] = useState(null);
  const [smeForm, setSmeForm] = useState(emptySmeForm);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [activeTab, setActiveTab] = useState('outreach');
  const [smeLogs, setSmeLogs] = useState([]);

  useEffect(() => {
    const loadEmailsCrmData = async () => {
      try {
        setIsLoading(true);

        const cachedData = loadWarmBootCache(teamId);
        if (cachedData && cachedData.smes.length > 0) {
          setSmes(cachedData.smes);
          setTemplates(cachedData.templates);
          setPointPeople(cachedData.pointPeople);
          setIsLoading(false);
        }

        const [smesResponse, templatesResponse, pointPeopleResponse] = await Promise.all([
          emailsCrmService.getSmes(),
          emailsCrmService.getTemplates(),
          emailsCrmService.getPointPeople()
        ]);

        const nextSmes = smesResponse?.data?.data || [];
        const nextTemplates = templatesResponse?.data?.data || [];
        const nextPointPeople = pointPeopleResponse?.data?.data || [];

        setSmes(nextSmes);
        setTemplates(nextTemplates);
        setPointPeople(nextPointPeople);
        saveWarmBootCache(teamId, { smes: nextSmes, templates: nextTemplates, pointPeople: nextPointPeople });
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Failed to load Emails CRM data');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmailsCrmData();
  }, [teamId]);

  useEffect(() => {
    if (!showSmeForm) return;

    setSmeForm((current) => {
      if (current.pointPersonUserId || current.pointPersonNameSnapshot || pointPeople.length === 0) {
        return current;
      }

      const defaultPointPerson = pointPeople[0];
      return {
        ...current,
        pointPersonUserId: defaultPointPerson?.id || '',
        pointPersonNameSnapshot: defaultPointPerson?.username || ''
      };
    });
  }, [pointPeople, showSmeForm]);

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
      setSmeLogs([]);
    }
  }, [smes, selectedSmeId]);

  useEffect(() => {
    if (!selectedSmeId) {
      setSmeLogs([]);
      return;
    }

    const loadLogs = async () => {
      try {
        const response = await emailsCrmService.getSmeLogs(selectedSmeId);
        setSmeLogs(response?.data?.data || []);
      } catch (_error) {
        setSmeLogs([]);
      }
    };

    loadLogs();
  }, [selectedSmeId]);

  const handleSelectSme = (smeId) => {
    setSelectedSmeId(smeId);
    setSelectedTemplateId('');
    setDraftMessage('');
    setSmeLogs([]);
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

  const handleStatusChange = async (status) => {
    if (!selectedSme) return;

    try {
      const response = await emailsCrmService.updateSme(selectedSme.id, { status });
      const updatedSme = response?.data?.data;

      setSmes((current) =>
        current.map((sme) => (sme.id === selectedSme.id ? (updatedSme || { ...sme, status }) : sme))
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to update SME status');
    }
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
      pointPersonUserId: sme.pointPersonUserId || '',
      pointPersonNameSnapshot: sme.pointPersonNameSnapshot || sme.pointPerson || '',
      status: sme.status || SME_STATUSES[0],
      lastContactDate: sme.lastContactDate || '',
      notes: sme.notes || '',
      profilePicture: sme.profilePicture || '',
      summary: sme.summary || '',
      email: sme.email || '',
      phone: sme.phone || '',
      linkedinUrl: sme.linkedinUrl || ''
    });
    setShowSmeForm(true);
  };

  const handleSaveSme = async (event) => {
    event.preventDefault();

    if (!smeForm.name.trim() || !smeForm.title.trim() || !smeForm.organization.trim()) {
      return;
    }

    try {
      if (editingSmeId) {
        const response = await emailsCrmService.updateSme(editingSmeId, smeForm);
        const updatedSme = response?.data?.data;

        setSmes((current) =>
          current.map((sme) => (sme.id === editingSmeId ? (updatedSme || { ...sme, ...smeForm }) : sme))
        );
      } else {
        const response = await emailsCrmService.createSme(smeForm);
        const newSme = response?.data?.data;

        if (newSme) {
          setSmes((current) => [newSme, ...current]);
          setSelectedSmeId(newSme.id);
        }
      }

      setShowSmeForm(false);
      setEditingSmeId(null);
      setSmeForm(emptySmeForm);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to save SME');
    }
  };

  const handleDeleteSme = async (id) => {
    try {
      await emailsCrmService.deleteSme(id);
      setSmes((current) => current.filter((sme) => sme.id !== id));

      if (selectedSmeId === id) {
        setSelectedSmeId(null);
        setSelectedTemplateId('');
        setDraftMessage('');
      }

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to delete SME');
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

  const handleSaveTemplate = async (event) => {
    event.preventDefault();

    if (!templateForm.templateName.trim() || !templateForm.content.trim()) {
      return;
    }

    try {
      if (editingTemplateId) {
        const response = await emailsCrmService.updateTemplate(editingTemplateId, templateForm);
        const updatedTemplate = response?.data?.data;

        setTemplates((current) =>
          current.map((template) =>
            template.id === editingTemplateId
              ? (updatedTemplate || { ...template, ...templateForm })
              : template
          )
        );
      } else {
        const response = await emailsCrmService.createTemplate(templateForm);
        const newTemplate = response?.data?.data;

        if (newTemplate) {
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
      }

      setEditingTemplateId(null);
      setTemplateForm(emptyTemplateForm);
      setIsEditingTemplate(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await emailsCrmService.deleteTemplate(id);
      setTemplates((current) => current.filter((template) => template.id !== id));

      if (selectedTemplateId === id) {
        setSelectedTemplateId('');
        setDraftMessage('');
      }

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to delete template');
    }
  };

  const closeOutreachModal = () => {
    setSelectedSmeId(null);
    setSelectedTemplateId('');
    setDraftMessage('');
    setSmeLogs([]);
  };

  useEffect(() => {
    if (activeTab !== 'outreach' || !selectedSmeId) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeOutreachModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, selectedSmeId]);

  const handleAddLog = async (logForm) => {
    if (!selectedSmeId) return;
    try {
      const response = await emailsCrmService.createSmeLog(selectedSmeId, logForm);
      const newLog = response?.data?.data;
      if (newLog) {
        setSmeLogs((current) => [newLog, ...current]);
      }
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to save conversation log');
    }
  };

  const handleUpdateLog = async (logId, payload) => {
    try {
      const response = await emailsCrmService.updateSmeLog(logId, payload);
      const updated = response?.data?.data;
      setSmeLogs((current) =>
        current.map((log) => (log.id === logId ? (updated || { ...log, ...payload }) : log))
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to update conversation log');
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await emailsCrmService.deleteSmeLog(logId);
      setSmeLogs((current) => current.filter((log) => log.id !== logId));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to delete conversation log');
    }
  };

  const cancelTemplateEdit = () => {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
    setIsEditingTemplate(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text">Emails CRM</h1>
        <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base lg:text-lg">
          Track SME outreach, draft template-based messages, and update communication status.
        </p>
      </header>

      <div className="mb-6 border-b border-slate-200 dark:border-dm-border">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab('outreach')}
            className={`inline-flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'outreach'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-700 dark:text-dm-muted hover:text-slate-800 dark:hover:text-dm-text'
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
                : 'border-transparent text-slate-700 dark:text-dm-muted hover:text-slate-800 dark:hover:text-dm-text'
            }`}
          >
            <HugeiconsIcon icon={DocumentAttachmentIcon} size={18} color="currentColor" />
            Template Manager
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated p-6 text-slate-700 dark:text-dm-muted">
          Loading Emails CRM data...
        </div>
      )}

      {!isLoading && showSmeForm && (
        <section className="mb-6 rounded-xl border border-emerald-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-hero px-6 py-4">
            <h2 className="text-lg font-semibold text-white">
              {editingSmeId ? 'Edit SME' : 'Add SME'}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {editingSmeId ? 'Update the SME record details below.' : 'Fill in the details to add a new Subject Matter Expert.'}
            </p>
          </div>

          <form className="p-5 md:p-6 space-y-6" onSubmit={handleSaveSme}>
            {/* Basic Info */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">Basic Info</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">SME Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={smeForm.name}
                    onChange={(event) => setSmeForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={smeForm.title}
                    onChange={(event) => setSmeForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. Senior Engineer"
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Organization <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={smeForm.organization}
                    onChange={(event) => setSmeForm((current) => ({ ...current, organization: event.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Last Contact Date</label>
                  <input
                    type="date"
                    value={smeForm.lastContactDate}
                    onChange={(event) => setSmeForm((current) => ({ ...current, lastContactDate: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Status & Assignment */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">Status &amp; Assignment</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Point Person</label>
                  <select
                    value={smeForm.pointPersonUserId}
                    onChange={(event) => {
                      const selectedUser = pointPeople.find((person) => person.id === event.target.value);
                      setSmeForm((current) => ({
                        ...current,
                        pointPersonUserId: event.target.value,
                        pointPersonNameSnapshot: selectedUser?.username || current.pointPersonNameSnapshot
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  >
                    <option value="">Select point person...</option>
                    {pointPeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Status</label>
                  <select
                    value={smeForm.status}
                    onChange={(event) => setSmeForm((current) => ({ ...current, status: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  >
                    {SME_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Notes</label>
                  <textarea
                    value={smeForm.notes}
                    onChange={(event) => setSmeForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Any relevant notes..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Profile & Contact */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">Profile &amp; Contact</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Profile Picture URL</label>
                  <input
                    type="url"
                    value={smeForm.profilePicture}
                    onChange={(event) => setSmeForm((current) => ({ ...current, profilePicture: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Brief Summary / Bio</label>
                  <textarea
                    value={smeForm.summary}
                    onChange={(event) => setSmeForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Short background or bio..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Email Address</label>
                  <input
                    type="email"
                    value={smeForm.email}
                    onChange={(event) => setSmeForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Phone / Mobile Number</label>
                  <input
                    type="tel"
                    value={smeForm.phone}
                    onChange={(event) => setSmeForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+1 234 567 8900"
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-text mb-1">Social Media URL</label>
                  <input
                    type="url"
                    value={smeForm.linkedinUrl}
                    onChange={(event) => setSmeForm((current) => ({ ...current, linkedinUrl: event.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-dm-border">
              <button
                type="submit"
                className="rounded-lg bg-gradient-action px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                {editingSmeId ? 'Save Changes' : 'Add SME'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSmeForm(false);
                  setEditingSmeId(null);
                  setSmeForm(emptySmeForm);
                }}
                className="rounded-lg border border-slate-300 dark:border-dm-border bg-white dark:bg-dm-elevated px-5 py-2 text-sm font-semibold text-slate-700 dark:text-dm-text hover:bg-slate-50 dark:hover:bg-dm-elevated/80 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {!isLoading && activeTab === 'outreach' && (
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
                smeLogs={smeLogs}
                onTemplateSelect={handleTemplateSelect}
                onDraftChange={setDraftMessage}
                onCopy={handleCopy}
                onStatusChange={handleStatusChange}
                onAddLog={handleAddLog}
                onUpdateLog={handleUpdateLog}
                onDeleteLog={handleDeleteLog}
              />
            </div>
          )}
        </div>
      )}

      {!isLoading && activeTab === 'templates' && (
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

      {!isLoading && activeTab === 'outreach' && selectedSme && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center bg-slate-800/40 dark:bg-black/60 p-6">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close email details"
            onClick={closeOutreachModal}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <button
              type="button"
              onClick={closeOutreachModal}
              className="absolute right-3 top-3 rounded-md border border-slate-300 dark:border-dm-border bg-slate-100 dark:bg-dm-elevated px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-dm-text hover:bg-slate-200 dark:hover:bg-dm-elevated/80"
            >
              Close
            </button>

            <OutreachHub
              selectedSme={selectedSme}
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              draftMessage={draftMessage}
              copyButtonText={copyButtonText}
              smeLogs={smeLogs}
              onTemplateSelect={handleTemplateSelect}
              onDraftChange={setDraftMessage}
              onCopy={handleCopy}
              onStatusChange={handleStatusChange}
              onAddLog={handleAddLog}
              onUpdateLog={handleUpdateLog}
              onDeleteLog={handleDeleteLog}
            />
          </div>
        </div>
      )}
    </div>
  );
};