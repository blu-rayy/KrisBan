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
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Template Manager</h2>
        <button
          type="button"
          onClick={onStartTemplateCreate}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-50 hover:bg-emerald-700"
        >
          Add Template
        </button>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="rounded-md border border-slate-200 bg-slate-100">
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
                  className="text-slate-600"
                />
                <span className="truncate text-sm font-medium text-slate-700">{template.templateName}</span>
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
              <form onSubmit={onSaveTemplate} className="border-t border-slate-200 p-3 space-y-3">
                <input
                  type="text"
                  value={templateForm.templateName}
                  onChange={(event) =>
                    onTemplateFormChange((current) => ({ ...current, templateName: event.target.value }))
                  }
                  placeholder="Template name"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
                  required
                />
                <textarea
                  rows={8}
                  value={templateForm.content}
                  onChange={(event) =>
                    onTemplateFormChange((current) => ({ ...current, content: event.target.value }))
                  }
                  placeholder="Template content with merge tags"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
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
                    className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      {isEditingTemplate && !editingTemplateId && (
        <form onSubmit={onSaveTemplate} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-100 p-3">
          <p className="text-sm font-semibold text-slate-800">New Template</p>
          <input
            type="text"
            value={templateForm.templateName}
            onChange={(event) =>
              onTemplateFormChange((current) => ({ ...current, templateName: event.target.value }))
            }
            placeholder="Template name"
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
            required
          />
          <textarea
            rows={8}
            value={templateForm.content}
            onChange={(event) =>
              onTemplateFormChange((current) => ({ ...current, content: event.target.value }))
            }
            placeholder="Template content with merge tags"
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
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
              className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
