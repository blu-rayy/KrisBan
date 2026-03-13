import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, Delete02Icon } from '@hugeicons/core-free-icons';

export const TemplateManagerPanel = ({
  templates,
  editingTemplateId,
  templateForm,
  isEditingTemplate,
  onTemplateFormChange,
  onSaveTemplate,
  onCancelTemplateEdit,
  onStartTemplateCreate,
  onStartTemplateEdit,
  onDeleteTemplate
}) => {
  const [expandedTemplateId, setExpandedTemplateId] = useState(null);
  const hasTemplates = templates.length > 0;

  useEffect(() => {
    if (!isEditingTemplate) {
      setExpandedTemplateId(null);
      return;
    }

    if (editingTemplateId) {
      setExpandedTemplateId(editingTemplateId);
    }
  }, [isEditingTemplate, editingTemplateId]);

  const handleToggleTemplate = (template) => {
    const isExpanded = expandedTemplateId === template.id;

    if (isExpanded) {
      setExpandedTemplateId(null);
      if (editingTemplateId === template.id) {
        onCancelTemplateEdit();
      }
      return;
    }

    setExpandedTemplateId(template.id);
    onStartTemplateEdit(template);
  };

  return (
    <section className="rounded-xl border border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-dm-text">Template Manager</h2>
        <button
          type="button"
          onClick={onStartTemplateCreate}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 bg-[linear-gradient(180deg,#10b981_0%,#059669_100%)] text-sm font-semibold leading-none text-slate-50 shadow-sm hover:bg-[linear-gradient(180deg,#10b981_0%,#047857_100%)] dark:bg-[linear-gradient(180deg,#34d399_0%,#059669_100%)] dark:hover:bg-[linear-gradient(180deg,#6ee7b7_0%,#10b981_100%)]"
          aria-label="Add Template"
          title="Add Template"
        >
          <span className="block -translate-y-px leading-none">+</span>
        </button>
      </div>

      <div className="space-y-2">
        {hasTemplates ? templates.map((template) => (
          <div key={template.id} className="rounded-md border border-slate-200 dark:border-dm-border bg-slate-100 dark:bg-dm-elevated">
            <div className="flex items-center justify-between px-3 py-2">
              <button
                type="button"
                onClick={() => handleToggleTemplate(template)}
                className="inline-flex min-w-0 items-center gap-2 text-left"
              >
                <HugeiconsIcon
                  icon={expandedTemplateId === template.id ? ArrowUp01Icon : ArrowDown01Icon}
                  size={16}
                  color="currentColor"
                  className="text-slate-600 dark:text-dm-soft"
                />
                <span className="truncate text-sm font-medium text-slate-700 dark:text-dm-text">{template.templateName}</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteTemplate(template.id)}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                aria-label={`Delete ${template.templateName}`}
                title="Delete template"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" />
              </button>
            </div>

            {expandedTemplateId === template.id && editingTemplateId === template.id && isEditingTemplate && (
              <form onSubmit={onSaveTemplate} className="border-t border-slate-200 dark:border-dm-border p-3 space-y-3">
                <input
                  type="text"
                  value={templateForm.templateName}
                  onChange={(event) =>
                    onTemplateFormChange((current) => ({ ...current, templateName: event.target.value }))
                  }
                  placeholder="Template name"
                  className="w-full rounded-md border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-card px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-600 focus:outline-none"
                  required
                />
                <textarea
                  rows={8}
                  value={templateForm.content}
                  onChange={(event) =>
                    onTemplateFormChange((current) => ({ ...current, content: event.target.value }))
                  }
                  placeholder="Template content with merge tags"
                  className="w-full rounded-md border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-card px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-600 focus:outline-none"
                  required
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-50 hover:bg-emerald-700"
                  >
                    Save Template
                  </button>
                  <button
                    type="button"
                    onClick={onCancelTemplateEdit}
                    className="rounded-md border border-slate-300 dark:border-dm-border bg-slate-100 dark:bg-dm-elevated px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-dm-text hover:bg-slate-200 dark:hover:bg-dm-elevated/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-dm-border bg-slate-100 dark:bg-dm-elevated p-4 text-sm text-slate-600 dark:text-dm-muted">
            No templates added yet, add your own to start composing outreach messages.
          </div>
        )}
      </div>

      {isEditingTemplate && !editingTemplateId && (
        <form onSubmit={onSaveTemplate} className="mt-4 space-y-3 rounded-lg border border-slate-200 dark:border-dm-border bg-slate-100 dark:bg-dm-elevated p-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-dm-text">New Template</p>
          <input
            type="text"
            value={templateForm.templateName}
            onChange={(event) =>
              onTemplateFormChange((current) => ({ ...current, templateName: event.target.value }))
            }
            placeholder="Template name"
            className="w-full rounded-md border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-card px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-600 focus:outline-none"
            required
          />
          <textarea
            rows={8}
            value={templateForm.content}
            onChange={(event) =>
              onTemplateFormChange((current) => ({ ...current, content: event.target.value }))
            }
            placeholder="Template content with merge tags"
            className="w-full rounded-md border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-card px-3 py-2 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-600 focus:outline-none"
            required
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-50 hover:bg-emerald-700"
            >
              Save Template
            </button>
            <button
              type="button"
              onClick={onCancelTemplateEdit}
              className="rounded-md border border-slate-300 dark:border-dm-border bg-slate-100 dark:bg-dm-elevated px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-dm-text hover:bg-slate-200 dark:hover:bg-dm-elevated/80"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
