import { useState } from 'react';
import { SME_STATUSES } from '../../utils/smeOutreachMockData';
import { SMEProfileCard } from './SMEProfileCard';

let _nextKey = 1;
const makeKey = () => _nextKey++;

const makeEmptyMessage = (direction = 'sent') => ({
  _key: makeKey(),
  direction,
  content: ''
});

const makeEmptyLogForm = () => ({
  logDate: new Date().toISOString().slice(0, 10),
  messages: [makeEmptyMessage('sent')]
});

const getInitials = (name = '') =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

const ChatAvatar = ({ name, profilePicture, size = 'sm' }) => {
  const dim = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs';
  return profilePicture ? (
    <img
      src={profilePicture}
      alt={name || ''}
      className={`${dim} rounded-full border border-slate-200 object-cover shrink-0`}
    />
  ) : (
    <span
      className={`${dim} inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-200 font-semibold text-slate-600 shrink-0`}
    >
      {getInitials(name)}
    </span>
  );
};

const MessageEditor = ({ messages, onChange }) => {
  const update = (idx, field, value) =>
    onChange(messages.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const remove = (idx) => onChange(messages.filter((_, i) => i !== idx));

  const add = (direction) => onChange([...messages, makeEmptyMessage(direction)]);

  return (
    <div className="space-y-2">
      {messages.map((msg, idx) => (
        <div
          key={msg._key}
          className={`flex gap-2 items-start rounded-lg border p-2 ${
            msg.direction === 'sent'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              update(idx, 'direction', msg.direction === 'sent' ? 'received' : 'sent')
            }
            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              msg.direction === 'sent'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
            title="Click to toggle sender"
          >
            {msg.direction === 'sent' ? 'Us' : 'Them'}
          </button>
          <textarea
            rows={3}
            value={msg.content}
            onChange={(e) => update(idx, 'content', e.target.value)}
            placeholder={msg.direction === 'sent' ? 'What we sent...' : 'Their reply...'}
            className="flex-1 rounded border border-slate-300 bg-transparent px-2 py-1 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none resize-none"
          />
          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => remove(idx)}
              className="shrink-0 rounded border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-100 transition-colors"
              title="Remove message"
            >
              
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => add('sent')}
          className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          + Us
        </button>
        <button
          type="button"
          onClick={() => add('received')}
          className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          + Them
        </button>
      </div>
    </div>
  );
};

const LogEntry = ({ log, sme, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(log.logDate || '');
  const [editMessages, setEditMessages] = useState(() =>
    (log.messages || []).map((m) => ({ ...m, _key: makeKey() }))
  );

  const handleSave = () => {
    const cleaned = editMessages.map(({ _key, ...m }) => m).filter((m) => m.content.trim());
    if (!cleaned.length) return;
    onUpdate(log.id, { logDate: editDate, messages: cleaned });
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
        />
        <MessageEditor messages={editMessages} onChange={setEditMessages} />
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

  const messages = log.messages || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {formattedDate}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {messages.map((msg, idx) =>
        msg.direction === 'sent' ? (
          <div key={idx} className="flex items-end justify-end gap-2">
            <div className="max-w-[80%] space-y-0.5">
              <p className="text-right text-[10px] font-semibold text-slate-400 pr-1">
                {sme?.pointPerson || 'Us'}
              </p>
              <div className="rounded-2xl rounded-br-sm bg-emerald-600 px-3 py-2 text-xs text-white shadow-sm">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
            <ChatAvatar name={sme?.pointPerson} profilePicture={sme?.pointPersonProfilePicture} />
          </div>
        ) : (
          <div key={idx} className="flex items-end gap-2">
            <ChatAvatar name={sme?.name} profilePicture={sme?.profilePicture} />
            <div className="max-w-[80%] space-y-0.5">
              <p className="text-[10px] font-semibold text-slate-400 pl-1">{sme?.name || 'SME'}</p>
              <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-3 py-2 text-xs text-slate-800 shadow-sm">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="flex justify-end gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(log.id)}
          className="rounded border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
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
  const [logForm, setLogForm] = useState(makeEmptyLogForm);
  const [showLogForm, setShowLogForm] = useState(false);

  if (!selectedSme) return null;

  const handleUseDraft = () => {
    if (draftMessage.trim()) {
      setLogForm((f) => ({
        ...f,
        messages: [{ _key: makeKey(), direction: 'sent', content: draftMessage }]
      }));
      setShowLogForm(true);
    }
  };

  const handleSubmitLog = () => {
    const cleaned = logForm.messages
      .map(({ _key, ...m }) => m)
      .filter((m) => m.content.trim());
    if (!cleaned.length) return;
    onAddLog({ logDate: logForm.logDate, messages: cleaned });
    setLogForm(makeEmptyLogForm());
    setShowLogForm(false);
  };

  const hasContent = logForm.messages.some((m) => m.content.trim());

  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Outreach Hub</h2>

      <SMEProfileCard sme={selectedSme} />

      <div className="my-5 border-t border-slate-200" />

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

      <div className="my-5 border-t border-slate-200" />

      <div className="flex items-center justify-between mb-4">
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
            if (!showLogForm) setLogForm(makeEmptyLogForm());
          }}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          {showLogForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showLogForm && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <input
            type="date"
            value={logForm.logDate}
            onChange={(e) => setLogForm((f) => ({ ...f, logDate: e.target.value }))}
            className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
          <MessageEditor
            messages={logForm.messages}
            onChange={(msgs) => setLogForm((f) => ({ ...f, messages: msgs }))}
          />
          <button
            type="button"
            onClick={handleSubmitLog}
            disabled={!hasContent}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save Entry
          </button>
        </div>
      )}

      {smeLogs && smeLogs.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 space-y-4">
          {smeLogs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              sme={selectedSme}
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