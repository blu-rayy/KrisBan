import { useState } from 'react';
import { SME_STATUSES } from '../../utils/smeOutreachMockData';
import { SMEProfileCard } from './SMEProfileCard';

const emptyLogForm = {
  logDate: new Date().toISOString().slice(0, 10),
  sentMessage: '',
  response: ''
};

const LogEntry = ({ log, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    logDate: log.logDate || '',
    sentMessage: log.sentMessage || '',
    response: log.response || ''
  });

  const handleSave = () => {
    onUpdate(log.id, editForm);
    setIsEditing(false);
  };

  const formattedDate = log.logDate
    ? new Date(log.logDate + 'T00:00:00').toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'No date';

  if (isEditing) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
        <input
          type="date"
          value={editForm.logDate}
          onChange={(e) => setEditForm((f) => ({ ...f, logDate: e.target.value }))}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
        />
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">What we sent</p>
          <textarea
            rows={4}
            value={editForm.sentMessage}
            onChange={(e) => setEditForm((f) => ({ ...f, sentMessage: e.target.value }))}
            placeholder="What we sent..."
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Their response</p>
          <textarea
            rows={3}
            value={editForm.response}
            onChange={(e) => setEditForm((f) => ({ ...f, response: e.target.value }))}
            placeholder="Their response..."
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs font-semibold text-slate-500">{formattedDate}</span>
          {log.sentMessage && (
            <span className="truncate text-xs text-slate-500">
              {log.sentMessage.slice(0, 55)}{log.sentMessage.length > 55 ? '…' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {log.response && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Replied
            </span>
          )}
          <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-100 space-y-2 pt-2">
          {log.sentMessage && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sent</p>
              <p className="whitespace-pre-wrap text-xs text-slate-700">{log.sentMessage}</p>
            </div>
          )}
          {log.response && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Their Response</p>
              <p className="whitespace-pre-wrap text-xs text-slate-700">{log.response}</p>
            </div>
          )}
          {!log.sentMessage && !log.response && (
            <p className="text-xs text-slate-400 italic">No content recorded.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(log.id)}
              className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const OutreachHub = ({
  selectedSme,
  templates,
  selectedTemplateId,
  draftMessage,
  copyButtonText,
  smeLogs,
  onTemplateSelect,
  onDraftChange,
  onCopy,
  onStatusChange,
  onAddLog,
  onUpdateLog,
  onDeleteLog
}) => {
  const [logForm, setLogForm] = useState(emptyLogForm);
  const [showLogForm, setShowLogForm] = useState(false);

  if (!selectedSme) return null;

  const handleUseDraft = () => {
    if (draftMessage.trim()) {
      setLogForm((f) => ({ ...f, sentMessage: draftMessage }));
      setShowLogForm(true);
    }
  };

  const handleSubmitLog = () => {
    if (!logForm.sentMessage.trim() && !logForm.response.trim()) return;
    onAddLog(logForm);
    setLogForm(emptyLogForm);
    setShowLogForm(false);
  };

  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Outreach Hub</h2>

      <SMEProfileCard sme={selectedSme} />

      <div className="my-5 border-t border-slate-200" />

      {/* Outreach Tools */}
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Outreach Tools</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="template-select" className="mb-2 block text-sm font-medium text-slate-800">
            Email Template
          </label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={(event) => onTemplateSelect(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Select template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.templateName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-select" className="mb-2 block text-sm font-medium text-slate-800">
            Quick Status Update
          </label>
          <select
            id="status-select"
            value={selectedSme.status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
          >
            {SME_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="parsed-template" className="mb-2 block text-sm font-medium text-slate-800">
            Draft Message
          </label>
          <textarea
            id="parsed-template"
            rows={10}
            value={draftMessage}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Choose a template to generate draft outreach content, or type your message..."
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-slate-50 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!draftMessage.trim()}
          >
            {copyButtonText}
          </button>
          <button
            type="button"
            onClick={handleUseDraft}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draftMessage.trim()}
            title="Pre-fill draft as the sent message in a new log entry"
          >
            Log as Sent
          </button>
        </div>
      </div>

      {/* Conversation Log */}
      <div className="my-5 border-t border-slate-200" />

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Conversation Log
          {smeLogs && smeLogs.length > 0 && (
            <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {smeLogs.length}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setShowLogForm((v) => !v);
            if (!showLogForm) setLogForm(emptyLogForm);
          }}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          {showLogForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showLogForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 space-y-2">
          <input
            type="date"
            value={logForm.logDate}
            onChange={(e) => setLogForm((f) => ({ ...f, logDate: e.target.value }))}
            className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">What we sent</p>
            <textarea
              rows={5}
              value={logForm.sentMessage}
              onChange={(e) => setLogForm((f) => ({ ...f, sentMessage: e.target.value }))}
              placeholder="Paste or type the message we sent..."
              className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Their response</p>
            <textarea
              rows={4}
              value={logForm.response}
              onChange={(e) => setLogForm((f) => ({ ...f, response: e.target.value }))}
              placeholder="Paste or type their reply (leave blank if no reply yet)..."
              className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmitLog}
            disabled={!logForm.sentMessage.trim() && !logForm.response.trim()}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save Entry
          </button>
        </div>
      )}

      {smeLogs && smeLogs.length > 0 ? (
        <div className="space-y-2">
          {smeLogs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              onUpdate={onUpdateLog}
              onDelete={onDeleteLog}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No conversation entries yet.</p>
      )}
    </aside>
  );
};
