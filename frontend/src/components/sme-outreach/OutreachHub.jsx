import { SME_STATUSES } from '../../utils/smeOutreachMockData';
import { SMEProfileCard } from './SMEProfileCard';

export const OutreachHub = ({
  selectedSme,
  templates,
  selectedTemplateId,
  draftMessage,
  copyButtonText,
  onTemplateSelect,
  onDraftChange,
  onCopy,
  onStatusChange
}) => {
  if (!selectedSme) return null;

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
            Parsed Template
          </label>
          <textarea
            id="parsed-template"
            rows={14}
            value={draftMessage}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Choose a template to generate draft outreach content..."
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-slate-50 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!draftMessage.trim()}
        >
          {copyButtonText}
        </button>
      </div>
    </aside>
  );
};