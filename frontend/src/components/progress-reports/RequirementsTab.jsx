import { useState, useEffect, useContext, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  FloppyDiskIcon,
  Upload01Icon
} from '@hugeicons/core-free-icons';
import { AuthContext } from '../../context/AuthContext';
import { requirementService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

// ─── Inline add/edit form ──────────────────────────────────────────────────────

function RequirementForm({ initial, parentId, onSave, onCancel }) {
  const [frId, setFrId]         = useState(initial?.frId        ?? '');
  const [title, setTitle]       = useState(initial?.title       ?? '');
  const [description, setDesc]  = useState(initial?.description ?? '');
  const [weight, setWeight]     = useState(initial?.weight      ?? 0);
  const [progress, setProgress] = useState(initial?.progress    ?? 0);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frId.trim() || !title.trim()) { setErr('ID and Title are required.'); return; }
    setSaving(true);
    setErr('');
    try {
      await onSave({ frId: frId.trim(), title: title.trim(), description: description.trim(), weight: Number(weight), progress: Number(progress), parentId });
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-dm-elevated border border-gray-200 dark:border-dm-border rounded-xl p-4 space-y-3">
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-dm-muted mb-1">ID</label>
          <input className="w-full text-sm border border-gray-200 dark:border-dm-border rounded-lg px-3 py-2 bg-white dark:bg-dm-card dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green" value={frId} onChange={(e) => setFrId(e.target.value)} placeholder="e.g. FR1.4" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-dm-muted mb-1">Title</label>
          <input className="w-full text-sm border border-gray-200 dark:border-dm-border rounded-lg px-3 py-2 bg-white dark:bg-dm-card dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Requirement title" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-dm-muted mb-1">Description</label>
        <textarea className="w-full text-sm border border-gray-200 dark:border-dm-border rounded-lg px-3 py-2 bg-white dark:bg-dm-card dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green resize-none" rows={2} value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-dm-muted mb-1">Weight <span className="text-gray-400">(contribution %)</span></label>
          <input type="number" min="0" max="100" step="0.01" className="w-full text-sm border border-gray-200 dark:border-dm-border rounded-lg px-3 py-2 bg-white dark:bg-dm-card dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-dm-muted mb-1">Progress <span className="text-gray-400">(0–100)</span></label>
          <input type="number" min="0" max="100" step="1" className="w-full text-sm border border-gray-200 dark:border-dm-border rounded-lg px-3 py-2 bg-white dark:bg-dm-card dark:text-dm-text focus:outline-none focus:ring-2 focus:ring-forest-green" value={progress} onChange={(e) => setProgress(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dm-border text-gray-600 dark:text-dm-muted hover:bg-gray-100 dark:hover:bg-dm-card transition">
          <HugeiconsIcon icon={Cancel01Icon} size={13} /> Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-forest-green text-white hover:bg-leaf-green transition disabled:opacity-60">
          <HugeiconsIcon icon={FloppyDiskIcon} size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// ─── Sub-requirement row (recursive, for rows inside the card table) ───────────

function SubRow({ node, depth, isAdmin, onUpdate, onDelete, onAdd }) {
  const [expanded, setExpanded]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [toggling, setToggling]     = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const isLeaf      = !hasChildren;
  const indent      = depth * 24;

  const handleToggle = async () => {
    if (!isAdmin || !isLeaf) return;
    setToggling(true);
    try { await onUpdate(node.id, { progress: node.progress >= 100 ? 0 : 100 }); }
    finally { setToggling(false); }
  };

  const handleProgressInput = async (e) => {
    const val = Math.min(100, Math.max(0, Number(e.target.value)));
    await onUpdate(node.id, { progress: val });
  };

  return (
    <>
      <tr className="border-t border-gray-100 dark:border-dm-border group hover:bg-gray-50 dark:hover:bg-dm-elevated transition-colors">
        {/* Checkbox + ID + Title */}
        <td className="py-3 pr-4" style={{ paddingLeft: `${16 + indent}px` }}>
          <div className="flex items-center gap-3">
            {/* Expand toggle (only if has children) */}
            {hasChildren ? (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="flex-shrink-0 text-gray-400 dark:text-dm-muted hover:text-gray-600 dark:hover:text-dm-text transition-colors">
                <HugeiconsIcon icon={expanded ? ArrowDown01Icon : ArrowRight01Icon} size={13} />
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

            {/* Checkbox (leaf only) */}
            {isLeaf && isAdmin ? (
              <button type="button" onClick={handleToggle} disabled={toggling} className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${node.progress >= 100 ? 'border-forest-green bg-forest-green' : 'border-gray-300 dark:border-dm-border hover:border-forest-green'}`}>
                {node.progress >= 100 && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} color="white" />}
              </button>
            ) : isLeaf ? (
              <div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${node.progress >= 100 ? 'border-forest-green bg-forest-green' : 'border-gray-200 dark:border-dm-border'}`}>
                {node.progress >= 100 && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} color="white" />}
              </div>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

            <span className="text-xs font-mono font-semibold text-forest-green bg-green-50 dark:bg-green-950/40 dark:text-leaf-green px-1.5 py-0.5 rounded flex-shrink-0">
              {node.frId}
            </span>
            <span className={`text-sm text-dark-charcoal dark:text-dm-text ${node.progress >= 100 ? 'line-through opacity-50' : ''}`}>
              {node.title}
            </span>
          </div>
        </td>

        {/* Weight */}
        <td className="py-3 px-4 text-xs text-gray-400 dark:text-dm-muted text-right whitespace-nowrap">
          {node.weight}%
        </td>

        {/* Progress bar + value */}
        <td className="py-3 px-4 w-48">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 dark:bg-dm-card rounded-full h-1.5">
              <div
                className="bg-forest-green h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, node.progress)}%` }}
              />
            </div>
            {isLeaf && isAdmin ? (
              <input
                type="number" min="0" max="100" step="1"
                className="w-12 text-xs text-center border border-gray-200 dark:border-dm-border rounded px-1 py-0.5 bg-white dark:bg-dm-card dark:text-dm-text focus:outline-none focus:ring-1 focus:ring-forest-green"
                value={Math.round(node.progress)}
                onChange={handleProgressInput}
              />
            ) : (
              <span className="text-xs font-semibold text-dark-charcoal dark:text-dm-text w-10 text-right">
                {Math.round(node.progress)}%
              </span>
            )}
          </div>
        </td>

        {/* Admin actions */}
        <td className="py-3 pl-2 pr-4 text-right">
          {isAdmin && (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => { setAddingChild(true); setExpanded(true); }} title="Add sub-requirement" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dm-card text-gray-400 hover:text-forest-green transition-colors">
                <HugeiconsIcon icon={Add01Icon} size={13} />
              </button>
              <button type="button" onClick={() => setEditing(true)} title="Edit" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dm-card text-gray-400 hover:text-blue-400 transition-colors">
                <HugeiconsIcon icon={Edit02Icon} size={13} />
              </button>
              <button type="button" onClick={() => onDelete(node.id, node.frId)} title="Delete" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dm-card text-gray-400 hover:text-red-400 transition-colors">
                <HugeiconsIcon icon={Delete02Icon} size={13} />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Edit form row */}
      {editing && (
        <tr className="bg-gray-50 dark:bg-dm-elevated">
          <td colSpan={4} className="px-4 py-3">
            <RequirementForm
              initial={node}
              parentId={node.parentId}
              onSave={async (fields) => { await onUpdate(node.id, fields); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          </td>
        </tr>
      )}

      {/* Add child form row */}
      {addingChild && (
        <tr className="bg-gray-50 dark:bg-dm-elevated">
          <td colSpan={4} className="px-4 py-3">
            <RequirementForm
              parentId={node.id}
              onSave={async (fields) => { await onAdd({ ...fields, parentId: node.id, orderIndex: node.children.length }); setAddingChild(false); }}
              onCancel={() => setAddingChild(false)}
            />
          </td>
        </tr>
      )}

      {/* Children rows */}
      {expanded && hasChildren && node.children.map((child) => (
        <SubRow
          key={child.id}
          node={child}
          depth={depth + 1}
          isAdmin={isAdmin}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAdd={onAdd}
        />
      ))}
    </>
  );
}

// ─── Top-level FR card (accordion) ────────────────────────────────────────────

function FRCard({ node, isAdmin, onUpdate, onDelete, onAdd }) {
  const [expanded, setExpanded]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [addingChild, setAddingChild] = useState(false);

  const pct = Math.round(node.progress);

  return (
    <div className="bg-white dark:bg-dm-card border border-gray-100 dark:border-dm-border rounded-2xl overflow-hidden">
      {/* Card header — always visible */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-dm-elevated transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Chevron */}
        <span className="text-gray-400 dark:text-dm-muted flex-shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
        </span>

        {/* FR ID badge */}
        <span className="text-xs font-mono font-bold text-forest-green bg-green-50 dark:bg-green-950/50 dark:text-leaf-green px-2 py-1 rounded-md flex-shrink-0">
          {node.frId}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-dark-charcoal dark:text-dm-text truncate">{node.title}</p>
          {node.description && !expanded && (
            <p className="text-xs text-gray-400 dark:text-dm-muted truncate mt-0.5">{node.description}</p>
          )}
        </div>

        {/* Weight + progress */}
        <div className="flex items-center gap-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-gray-400 dark:text-dm-muted hidden sm:block">w: {node.weight}%</span>

          {/* Mini progress bar */}
          <div className="hidden sm:flex items-center gap-2 w-28">
            <div className="flex-1 bg-gray-100 dark:bg-dm-elevated rounded-full h-1.5">
              <div className="bg-forest-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, node.progress)}%` }} />
            </div>
          </div>

          <span className="text-sm font-bold text-forest-green w-12 text-right">{pct}%</span>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={(e) => { e.stopPropagation(); setAddingChild(true); setExpanded(true); }} title="Add sub-requirement" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dm-elevated text-gray-400 hover:text-forest-green transition-colors">
                <HugeiconsIcon icon={Add01Icon} size={14} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Edit" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dm-elevated text-gray-400 hover:text-blue-400 transition-colors">
                <HugeiconsIcon icon={Edit02Icon} size={14} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(node.id, node.frId); }} title="Delete" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dm-elevated text-gray-400 hover:text-red-400 transition-colors">
                <HugeiconsIcon icon={Delete02Icon} size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-dm-border pt-4">
          <RequirementForm
            initial={node}
            parentId={null}
            onSave={async (fields) => { await onUpdate(node.id, fields); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-dm-border">
          {/* Description */}
          {node.description && (
            <p className="px-5 pt-4 pb-2 text-xs text-gray-500 dark:text-dm-muted leading-relaxed">
              {node.description}
            </p>
          )}

          {/* Add child form */}
          {addingChild && (
            <div className="px-5 py-3 border-b border-gray-100 dark:border-dm-border">
              <RequirementForm
                parentId={node.id}
                onSave={async (fields) => { await onAdd({ ...fields, parentId: node.id, orderIndex: node.children.length }); setAddingChild(false); }}
                onCancel={() => setAddingChild(false)}
              />
            </div>
          )}

          {/* Sub-requirements table */}
          {node.children && node.children.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dm-border">
                    <th className="text-left text-xs font-medium text-gray-400 dark:text-dm-muted py-2 px-4">Sub-Requirement</th>
                    <th className="text-right text-xs font-medium text-gray-400 dark:text-dm-muted py-2 px-4 whitespace-nowrap">Weight</th>
                    <th className="text-left text-xs font-medium text-gray-400 dark:text-dm-muted py-2 px-4 w-48">Progress</th>
                    <th className="py-2 px-4 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {node.children.map((child) => (
                    <SubRow
                      key={child.id}
                      node={child}
                      depth={0}
                      isAdmin={isAdmin}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onAdd={onAdd}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-4 text-xs text-gray-400 dark:text-dm-muted italic">
              No sub-requirements.{isAdmin ? ' Click + to add one.' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Overall progress donut ────────────────────────────────────────────────────

function OverallDonut({ overall }) {
  const { darkMode } = useTheme();
  const pct  = Math.min(100, Math.max(0, overall));
  const r    = 45;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="donut-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={r} fill="none" stroke={darkMode ? '#1f2f23' : '#e5e7eb'} strokeWidth="10" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke="url(#donut-grad)" strokeWidth="10"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-forest-green">{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-dark-charcoal dark:text-dm-text">Overall Progress</p>
        <p className="text-xs text-gray-400 dark:text-dm-muted">Weighted across all FRs</p>
      </div>
    </div>
  );
}

// ─── In-place tree helpers (avoids full reload on progress updates) ───────────

// All immutable — always return new objects, never mutate previous state

function recomputeProgress(nodes) {
  return nodes.map((node) => {
    if (!node.children?.length) return node;
    const newChildren = recomputeProgress(node.children);
    const newProgress = node.weight > 0
      ? Math.min(100, Math.max(0,
          Math.round(newChildren.reduce((s, c) => s + (c.weight / node.weight) * c.progress, 0) * 10) / 10
        ))
      : node.progress;
    return { ...node, children: newChildren, progress: newProgress };
  });
}

function deepUpdateNode(nodes, id, fields) {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...fields };
    if (node.children?.length) return { ...node, children: deepUpdateNode(node.children, id, fields) };
    return node;
  });
}

function calcOverall(roots) {
  return Math.round(roots.reduce((s, r) => s + (r.weight * r.progress) / 100, 0) * 10) / 10;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RequirementsTab() {
  const { user } = useContext(AuthContext);
  const isAdmin  = user?.role === 'ADMIN';

  const [tree, setTree]           = useState([]);
  const [overall, setOverall]     = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [addingRoot, setAddingRoot] = useState(false);
  const [seeding, setSeeding]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await requirementService.getAll();
      setTree(res.data.data || []);
      setOverall(res.data.overall ?? 0);
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (fields) => {
    await requirementService.create({ ...fields, orderIndex: fields.orderIndex ?? tree.length });
    await load();
  };

  const handleUpdate = (id, fields) => {
    // Optimistic: update UI immediately, fire API in background
    setTree((prev) => {
      const withUpdate = deepUpdateNode(prev, id, fields);
      const recomputed = recomputeProgress(withUpdate);
      setOverall(calcOverall(recomputed));
      return recomputed;
    });
    requirementService.update(id, fields).catch(() => {
      // On failure, reload to restore true server state
      load();
    });
  };

  const handleDelete = async (id, frId) => {
    if (!window.confirm(`Delete "${frId}" and all its sub-requirements?`)) return;
    await requirementService.remove(id);
    await load();
  };

  const handleSeed = async () => {
    if (!window.confirm('This will replace all existing requirements with the default Civiq FR data. Continue?')) return;
    setSeeding(true);
    try {
      const { data: res } = await requirementService.bulkSeed(CIVIQ_SEED);
      setTree(res.data || []);
      setOverall(res.overall ?? 0);
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 dark:text-dm-muted text-sm">Loading requirements…</div>;
  }

  if (error) {
    return <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <OverallDonut overall={overall} />

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSeed} disabled={seeding} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-dm-border text-gray-600 dark:text-dm-muted hover:bg-gray-100 dark:hover:bg-dm-elevated transition disabled:opacity-60">
              <HugeiconsIcon icon={Upload01Icon} size={14} />
              {seeding ? 'Importing…' : 'Import Default FRs'}
            </button>
            <button type="button" onClick={() => setAddingRoot(true)} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-forest-green text-white hover:bg-leaf-green transition">
              <HugeiconsIcon icon={Add01Icon} size={14} />
              Add FR
            </button>
          </div>
        )}
      </div>

      {/* Add root FR form */}
      {addingRoot && (
        <RequirementForm
          parentId={null}
          onSave={async (fields) => { await handleAdd({ ...fields, orderIndex: tree.length }); setAddingRoot(false); }}
          onCancel={() => setAddingRoot(false)}
        />
      )}

      {/* FR cards */}
      {tree.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-dm-muted text-sm">
          No functional requirements yet.
          {isAdmin && ' Use "Add FR" or "Import Default FRs" to get started.'}
        </div>
      ) : (
        <div className="space-y-3">
          {tree.map((node) => (
            <FRCard
              key={node.id}
              node={node}
              isAdmin={isAdmin}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const CIVIQ_SEED = [
  { id:'FR1', title:'Agent Perception & Individual Q-Value Estimation', description:'Each vehicle in the simulation operates as an independent learning agent. The agent must observe its local environment, encode temporal context across timesteps using a recurrent network, and produce per-action Q-values that represent the estimated utility of each available routing decision.', weight:10, progress:85, sub_requirements:[
    { id:'FR1.1', title:'Local Observation Vector Construction', description:'At each decision timestep, the agent must construct a 65-dimensional observation vector.', weight:3, progress:100 },
    { id:'FR1.2', title:'DRQN with GRU Hidden State', description:'The agent network must be implemented as a Deep Recurrent Q-Network (DRQN) augmented with a Gated Recurrent Unit (GRU).', weight:4, progress:90 },
    { id:'FR1.3', title:'Per-Action Q-Value Output', description:'The agent network must output a Q-value for each available routing action.', weight:3, progress:90 }
  ]},
  { id:'FR2', title:'Training Pipeline Stability', description:'The training loop must be numerically stable and produce a converging loss curve across all training configurations.', weight:10, progress:62, sub_requirements:[
    { id:'FR2.1', title:'Reward Normalization', description:'Raw episode rewards must be normalized to a bounded range before they enter the training loop.', weight:4, progress:65 },
    { id:'FR2.2', title:'Gradient Norm Control', description:'During training, gradient norms must remain within a controllable range.', weight:3, progress:55 },
    { id:'FR2.3', title:'Target Network Update Schedule', description:'The target network must update on a per-episode basis, not per gradient step.', weight:3, progress:100 }
  ]},
  { id:'FR3', title:'Hierarchical Coordination via Two-Stage QMIX Mixing', description:"The core architectural contribution of Civiq. QMIX's single mixing network is decomposed into two sequential mixing stages.", weight:45, progress:12, sub_requirements:[
    { id:'FR3.1', title:'RSU Zone Manager', description:'At every simulation timestep, each active vehicle must be assigned to exactly one RSU zone.', weight:8, progress:30 },
    { id:'FR3.2', title:'Local RSU Mixer (Level 2)', description:'Each RSU hosts a Local Mixing Network that aggregates the individual Q-values of all vehicles in its zone.', weight:12, progress:15 },
    { id:'FR3.3', title:'Global Mixer (Level 3)', description:'The Global Mixer aggregates the local Q_tot scalars from all active RSUs into a single global Q_tot.', weight:12, progress:15 },
    { id:'FR3.4', title:'End-to-End Single-Loss Backpropagation', description:'The entire three-level hierarchy must be trained jointly via a single scalar loss.', weight:13, progress:0 }
  ]},
  { id:'FR4', title:'Simulation Integration', description:'The framework must interface bidirectionally with the SUMO traffic simulator via the TraCI API.', weight:8, progress:80, sub_requirements:[
    { id:'FR4.1', title:'Vehicle State Retrieval via TraCI', description:'At each decision timestep, the system must query SUMO via TraCI to retrieve the current state of all active vehicles.', weight:4, progress:90 },
    { id:'FR4.2', title:'Routing Action Injection', description:'The selected route for each vehicle must be injected into the running SUMO simulation via TraCI.', weight:4, progress:80 }
  ]},
  { id:'FR5', title:'Traffic Scenario Generation', description:'The system must support LOS A, C, E conditions across three road network maps.', weight:7, progress:50, sub_requirements:[
    { id:'FR5.1', title:'LOS-Based Traffic Demand Generation', description:'The system must generate traffic demand scenarios calibrated to three standard LOS conditions.', weight:3, progress:70 },
    { id:'FR5.2', title:'Per-Map RSU Configuration and Validation', description:'Each of the three maps requires a dedicated RSU configuration file.', weight:4, progress:35 }
  ]},
  { id:'FR6', title:'Comparative Evaluation Protocol', description:'The system must produce statistically valid evaluation results comparing Civiq against two baselines.', weight:12, progress:25, sub_requirements:[
    { id:'FR6.1', title:'Selfish Routing Baseline', description:'The selfish routing baseline represents uncoordinated, individualistic driver behavior.', weight:2, progress:100 },
    { id:'FR6.2', title:'Mono QMIX Baseline Training and Evaluation', description:'The Mono QMIX baseline must be trained and evaluated across all three LOS conditions on all three maps.', weight:5, progress:10 },
    { id:'FR6.3', title:'Civiq Hierarchical Training and Evaluation', description:'Civiq must be trained and evaluated under the same conditions as the Mono QMIX baseline.', weight:4, progress:0 },
    { id:'FR6.4', title:'Multi-Seed Aggregation and Statistical Reporting', description:'All evaluation results must be aggregated across seeds to produce mean, SD, and 95% CI.', weight:1, progress:15 }
  ]},
  { id:'FR7', title:'Data Visualization & Analysis Dashboard', description:'The system must provide a web-based dashboard accessible to SME evaluators.', weight:8, progress:20, sub_requirements:[
    { id:'FR7.1', title:'Routing Effectiveness KPI Display', description:'The dashboard must display primary routing effectiveness metrics for all evaluated policies side by side.', weight:3, progress:20 },
    { id:'FR7.2', title:'Computational Performance Metrics Display', description:'The dashboard must display system-level computational metrics relevant to ISO/IEC 25010.', weight:3, progress:15 },
    { id:'FR7.3', title:'ISO/IEC 25010 Compliance Validation', description:'The system must be evaluated against ISO/IEC 25010 across five quality characteristics.', weight:2, progress:5 }
  ]}
];
