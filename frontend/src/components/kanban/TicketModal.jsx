import { useContext, useEffect, useRef, useState } from 'react';
import { isPast, isToday } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import { useKanbanMutations, useKanbanUsers, useLabels, useTicket } from '../../hooks/useKanban';
import { getInitials } from './TicketCard';
import { DatePicker } from '../shared/DatePicker';

const COVER_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#6B7280', '#1E293B',
];

// ── Shared input style ─────────────────────────────────────────────────────────
const INPUT_CLS =
  'w-full px-3 py-2 border border-gray-200 dark:border-dm-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-dm-elevated dark:text-dm-text';

// Small inline action chip used in the card toolbar
const ActionChip = ({ onClick, icon, children, active }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
      active
        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
        : 'bg-slate-100 dark:bg-dm-elevated text-slate-600 dark:text-dm-text hover:bg-slate-200 dark:hover:bg-dm-elevated border-transparent dark:border-dm-border'
    }`}
  >
    {icon}{children}
  </button>
);

// ── Avatar ─────────────────────────────────────────────────────────────────────
const PALETTE = ['#15803d','#00875a','#bf2600','#403294','#0065ff','#ff5630','#36b37e','#6554c0','#ff8b00','#00a3bf'];
function stringToColor(str = 'U') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const AvatarCircle = ({ user, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-xs';
  const name = user?.full_name || user?.fullName || user?.username || 'U';
  const pic  = user?.profile_picture || user?.profilePicture;
  const bg   = stringToColor(name);
  return (
    <div
      className={`${sz} rounded-full text-white font-bold flex items-center justify-center overflow-hidden flex-shrink-0`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {pic ? (
        <img src={pic} alt="" className="w-full h-full object-cover" />
      ) : getInitials(user)}
    </div>
  );
};

// ── Section heading ────────────────────────────────────────────────────────────
const SectionHead = ({ icon, title, action }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2.5 text-slate-900 dark:text-dm-text">
      {icon}
      <h4 className="font-semibold text-[15px]">{title}</h4>
    </div>
    {action}
  </div>
);

// ── Inline SVG icons ───────────────────────────────────────────────────────────
const Icon = {
  card:    <svg className="w-5 h-5 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  desc:    <svg className="w-4 h-4 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="19" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  check:   <svg className="w-4 h-4 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  attach:  <svg className="w-4 h-4 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  label:   <svg className="w-4 h-4 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  user:    <svg className="w-4 h-4 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  comment: <svg className="w-4 h-4 text-slate-400 dark:text-dm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  cover:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  x:       <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── Description helpers ────────────────────────────────────────────────────────
const IMG_RE  = /(!\[image\]\(data:[^)]+\))/;
const IMG_SRC = /^!\[image\]\((data:[^)]+)\)$/;

const descToHtml = (text) => {
  if (!text) return '';
  return text.split(IMG_RE).map((part) => {
    const m = part.match(IMG_SRC);
    if (m) return `<img src="${m[1]}" alt="image" style="max-width:100%;border-radius:6px;display:block;margin:4px 0">`;
    return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }).join('');
};

const htmlToDesc = (el) => {
  let out = '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
    } else if (node.nodeName === 'IMG') {
      out += `![image](${node.src})`;
    } else if (node.nodeName === 'BR') {
      out += '\n';
    } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
      if (out && !out.endsWith('\n')) out += '\n';
      out += htmlToDesc(node);
    } else {
      out += htmlToDesc(node);
    }
  }
  return out;
};

// ── Main Modal ─────────────────────────────────────────────────────────────────
export const TicketModal = ({ ticketId, boardId, onClose }) => {
  const { user: me } = useContext(AuthContext);
  const { data: ticket, isLoading } = useTicket(ticketId);
  const { data: allUsers = [] } = useKanbanUsers();
  const { data: boardLabels = [] } = useLabels(boardId);
  const mutations = useKanbanMutations(boardId);

  const [title,            setTitle]            = useState('');
  const [desc,             setDesc]             = useState('');
  const [dueDate,          setDueDate]          = useState('');
  const [coverColor,       setCoverColor]       = useState('');
  const [newTask,          setNewTask]          = useState('');
  const [newComment,       setNewComment]       = useState('');
  const [newAttachName,    setNewAttachName]    = useState('');
  const [newAttachUrl,     setNewAttachUrl]     = useState('');
  const [showAttachForm,   setShowAttachForm]   = useState(false);
  const [showUserPicker,   setShowUserPicker]   = useState(false);
  const [showLabelPicker,  setShowLabelPicker]  = useState(false);
  const [showLabelForm,    setShowLabelForm]    = useState(false);
  const [showCoverPicker,  setShowCoverPicker]  = useState(false);
  const [editingDesc,      setEditingDesc]      = useState(false);
  const [newLabelName,     setNewLabelName]     = useState('');
  const [newLabelColor,    setNewLabelColor]    = useState('#3B82F6');
  const [editingLabelId,   setEditingLabelId]   = useState(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor,setEditingLabelColor]= useState('#3B82F6');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');
  const [saving,           setSaving]           = useState(false);
  const titleRef = useRef(null);
  const descRef  = useRef(null);

  useEffect(() => {
    if (!ticket) return;
    setTitle(ticket.title || '');
    setDesc(ticket.description || '');
    setDueDate(ticket.due_date || '');
    setCoverColor(ticket.cover_color || '');
  }, [ticket]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!editingDesc || !descRef.current) return;
    descRef.current.innerHTML = descToHtml(desc);
    descRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(descRef.current);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDesc]);

  const saveField = async (field, value) => {
    if (!ticket) return;
    setSaving(true);
    try {
      await mutations.updateTicket.mutateAsync({ ticketId: ticket.id, data: { [field]: value || null } });
    } finally { setSaving(false); }
  };

  const handleTitleBlur   = () => { if (title.trim() && title.trim() !== ticket?.title) saveField('title', title.trim()); };
  const handleDescSave = () => {
    const newDesc = descRef.current ? htmlToDesc(descRef.current) : desc;
    if (newDesc !== (ticket?.description || '')) saveField('description', newDesc);
    setDesc(newDesc);
    setEditingDesc(false);
  };
  const handleDescCancel = () => { setEditingDesc(false); };

  const handleDescPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          img.alt = 'image';
          img.style.cssText = 'max-width:100%;border-radius:6px;display:block;margin:4px 0';
          const sel = window.getSelection();
          if (sel?.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const renderDescWithImages = (text) => {
    if (!text) return <span className="text-slate-400 dark:text-dm-soft">Add a more detailed description…</span>;
    const parts = text.split(/(!\[image\]\(data:[^)]+(?:\)[^)]*)*\))/);
    return parts.map((part, i) => {
      const match = part.match(/^!\[image\]\((data:[^)]+(?:\)[^)]*)*)\)$/);
      if (match) return <img key={i} src={match[1]} alt="pasted" className="max-w-full rounded-lg my-1 block" />;
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };
  const handleDueDateChange = (e) => { setDueDate(e.target.value); saveField('due_date', e.target.value || null); };
  const handleCoverColor  = (color) => { const next = coverColor === color ? '' : color; setCoverColor(next); saveField('cover_color', next || null); };

  const assigneeIds   = new Set((ticket?.assignees || []).map((a) => a.user_id));
  const ticketLabelIds = new Set((ticket?.labels || []).map((l) => l.label_id));

  const toggleAssignee = (uid) => {
    if (!ticket) return;
    if (assigneeIds.has(uid)) mutations.removeAssignee.mutate({ ticketId: ticket.id, userId: uid });
    else mutations.addAssignee.mutate({ ticketId: ticket.id, userId: uid });
  };

  const toggleLabel = (labelId) => {
    if (!ticket) return;
    if (ticketLabelIds.has(labelId)) mutations.removeLabelFromTicket.mutate({ ticketId: ticket.id, labelId });
    else mutations.addLabelToTicket.mutate({ ticketId: ticket.id, labelId });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !ticket) return;
    await mutations.createTask.mutateAsync({ ticketId: ticket.id, title: newTask.trim() });
    setNewTask('');
  };

  const handleToggleTask = (task) => mutations.updateTask.mutate({ taskId: task.id, data: { done: !task.done }, ticketId: ticket?.id });
  const handleDeleteTask  = (task) => mutations.deleteTask.mutate({ taskId: task.id, ticketId: ticket.id });

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!newAttachName.trim() || !newAttachUrl.trim() || !ticket) return;
    await mutations.addAttachment.mutateAsync({ ticketId: ticket.id, data: { name: newAttachName.trim(), url: newAttachUrl.trim(), is_link: true } });
    setNewAttachName(''); setNewAttachUrl(''); setShowAttachForm(false);
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || !ticket) return;
    await mutations.createComment.mutateAsync({ ticketId: ticket.id, body: newComment.trim() });
    setNewComment('');
  };

  const handleSaveComment = async (commentId) => {
    if (!editingCommentBody.trim()) return;
    await mutations.updateComment.mutateAsync({ commentId, body: editingCommentBody.trim(), ticketId: ticket.id });
    setEditingCommentId(null);
  };

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    await mutations.createLabel.mutateAsync({ name: newLabelName.trim(), color: newLabelColor });
    setNewLabelName(''); setShowLabelForm(false);
  };

  const handleUpdateLabel = async (e) => {
    e.preventDefault();
    if (!editingLabelName.trim() || !editingLabelId) return;
    await mutations.updateLabel.mutateAsync({ labelId: editingLabelId, data: { name: editingLabelName.trim(), color: editingLabelColor } });
    setEditingLabelId(null);
  };

  const handleDeleteLabel = async (labelId) => {
    if (!window.confirm('Delete this label from the board? It will be removed from all cards.')) return;
    await mutations.deleteLabel.mutateAsync(labelId);
    setEditingLabelId(null);
  };

  const openLabelEdit = (e, lbl) => {
    e.stopPropagation();
    setEditingLabelId(lbl.id);
    setEditingLabelName(lbl.name);
    setEditingLabelColor(lbl.color);
    setShowLabelForm(false);
  };

  const handleArchive = async () => {
    if (!ticket || !window.confirm('Archive this ticket?')) return;
    await mutations.archiveTicket.mutateAsync(ticket.id);
    onClose();
  };

  const dueDateObj  = dueDate ? new Date(`${dueDate}T00:00:00`) : null;
  const dueDateStatus = dueDateObj
    ? (isPast(dueDateObj) && !isToday(dueDateObj) ? 'overdue' : isToday(dueDateObj) ? 'today' : 'normal')
    : 'normal';

  const tasks       = [...(ticket?.tasks       || [])].sort((a, b) => a.position - b.position);
  const attachments =   (ticket?.attachments   || []);
  const comments    = [...(ticket?.comments    || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const doneTasks  = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;
  const pct        = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal — white card */}
      <div className="relative z-10 w-full max-w-[900px] bg-white dark:bg-dm-elevated rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Cover strip ── */}
        {coverColor && <div className="h-20 w-full" style={{ backgroundColor: coverColor }} />}

        {/* ── Cover picker + Close — always top-right ── */}
        <div className={`absolute ${coverColor ? 'top-3' : 'top-2'} right-3 flex items-center gap-1.5 z-20`}>
          <button
            onClick={() => setShowCoverPicker((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white dark:bg-dm-elevated/90 dark:hover:bg-dm-elevated text-slate-700 dark:text-dm-text rounded-full text-xs font-medium shadow-sm"
          >
            {Icon.cover} Cover
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white dark:bg-dm-elevated/90 dark:hover:bg-dm-elevated text-slate-500 dark:text-dm-soft hover:text-slate-900 dark:hover:text-dm-text rounded-full shadow-sm"
          >
            {Icon.x}
          </button>
        </div>

        {/* ── Cover color picker ── */}
        {showCoverPicker && (
          <div className="mx-4 mt-2 mb-0 p-3 bg-white dark:bg-dm-card rounded-xl border border-gray-200 dark:border-dm-border shadow-lg">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-dm-soft uppercase tracking-wider mb-2">Colors</p>
            <div className="flex flex-wrap gap-2">
              {COVER_COLORS.map((c) => (
                <button key={c} onClick={() => handleCoverColor(c)}
                  className="w-10 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold hover:brightness-90 transition-all"
                  style={{ backgroundColor: c }}>
                  {coverColor === c && '✓'}
                </button>
              ))}
              {coverColor && (
                <button onClick={() => { handleCoverColor(''); setShowCoverPicker(false); }}
                  className="w-10 h-7 rounded-md bg-gray-200 dark:bg-dm-elevated text-gray-500 dark:text-dm-soft text-xs font-bold hover:bg-gray-300">
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Two-column body ── */}
        <div className="flex">

          {/* ══ LEFT: all card content ══ */}
          <div className="flex-1 min-w-0 px-5 pt-4 pb-6 space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 dark:text-dm-soft">Loading…</div>
            ) : (
              <>
                {/* Title */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-[11px] text-slate-400 dark:text-dm-muted">{Icon.card}</div>
                  <textarea
                    ref={titleRef}
                    className="flex-1 text-[24px] font-bold text-slate-900 dark:text-dm-text bg-transparent resize-none focus:outline-none focus:bg-slate-50 dark:focus:bg-dm-card rounded-lg px-2 py-1 -ml-2 leading-snug"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    rows={2}
                  />
                </div>

                {/* ── Unified Metadata Row ── */}
                <div className="ml-7 flex flex-wrap items-end gap-5 pb-3 border-b border-slate-100 dark:border-dm-border">
                  {/* Members */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-dm-muted uppercase tracking-wider mb-1.5">Members</p>
                    <div className="flex items-center gap-1">
                      {(ticket?.assignees || []).map((a) => {
                        const u = a.users || a;
                        return (
                          <button key={a.user_id} title={`Remove ${u.full_name || u.username}`} onClick={() => toggleAssignee(a.user_id)} className="hover:opacity-80 transition-opacity">
                            <AvatarCircle user={u} size="sm" />
                          </button>
                        );
                      })}
                      <button
                        onClick={() => { setShowUserPicker((v) => !v); setShowLabelPicker(false); }}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-dm-elevated hover:bg-slate-200 dark:hover:bg-dm-elevated text-slate-500 dark:text-dm-soft flex items-center justify-center text-base font-bold leading-none"
                      >+</button>
                    </div>
                  </div>

                  {/* Labels */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-dm-muted uppercase tracking-wider mb-1.5">Labels</p>
                    <div className="flex flex-wrap gap-1 items-center">
                      {(ticket?.labels || []).map((l) => {
                        const lbl = l.kanban_labels || l;
                        return (
                          <span
                            key={l.label_id}
                            className="inline-flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold"
                          >
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lbl.color }} />
                            {lbl.name}
                            <button
                              onClick={() => toggleLabel(l.label_id)}
                              className="opacity-60 hover:opacity-100 text-[10px] leading-none ml-0.5"
                              title="Remove label"
                            >✕</button>
                          </span>
                        );
                      })}
                      <button
                        onClick={() => { setShowLabelPicker((v) => !v); setShowUserPicker(false); }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-dm-elevated hover:bg-slate-200 dark:hover:bg-dm-elevated text-slate-500 dark:text-dm-soft text-base font-bold leading-none"
                      >+</button>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-dm-muted uppercase tracking-wider mb-1.5">Due Date</p>
                    <DatePicker value={dueDate} onChange={handleDueDateChange} status={dueDateStatus} className="w-36" compact />
                  </div>
                </div>

                {/* ── User picker ── */}
                {showUserPicker && (
                  <div className="ml-7 rounded-xl bg-white dark:bg-dm-card border border-gray-200 dark:border-dm-border shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 dark:text-dm-soft border-b border-gray-100 dark:border-dm-border">Members</div>
                    {allUsers.map((u) => (
                      <button key={u.id} onClick={() => toggleAssignee(u.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-dm-elevated text-slate-800 dark:text-dm-text ${assigneeIds.has(u.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                        <AvatarCircle user={u} size="sm" />
                        <span className="flex-1 text-left">{u.full_name || u.username}</span>
                        {assigneeIds.has(u.id) && <span className="text-emerald-500">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Label picker ── */}
                {showLabelPicker && (
                  <div className="ml-7 rounded-xl bg-white dark:bg-dm-card border border-gray-200 dark:border-dm-border shadow-xl overflow-hidden">
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 dark:text-dm-soft border-b border-gray-100 dark:border-dm-border">Labels</div>
                    <div className="p-2 space-y-0.5 max-h-52 overflow-y-auto">
                      {boardLabels.map((lbl) => (
                        <div key={lbl.id}>
                          {editingLabelId === lbl.id ? (
                            <form onSubmit={handleUpdateLabel} className="p-2 space-y-2 bg-slate-50 dark:bg-dm-card rounded-lg">
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  className="w-8 h-8 rounded cursor-pointer border border-gray-200 flex-shrink-0"
                                  value={editingLabelColor}
                                  onChange={(e) => setEditingLabelColor(e.target.value)}
                                />
                                <input
                                  className={`${INPUT_CLS} flex-1`}
                                  placeholder="Label name"
                                  value={editingLabelName}
                                  onChange={(e) => setEditingLabelName(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="flex gap-2 items-center justify-between">
                                <div className="flex gap-1.5">
                                  <button type="submit" className="text-xs bg-[#15803d] text-white px-3 py-1.5 rounded-full font-medium hover:bg-[#16a34a]">Save</button>
                                  <button type="button" onClick={() => setEditingLabelId(null)} className="text-xs text-slate-500 dark:text-dm-soft hover:underline px-2 py-1.5">Cancel</button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLabel(lbl.id)}
                                  className="text-xs text-red-400 hover:text-red-600 hover:underline px-2 py-1.5"
                                >Delete</button>
                              </div>
                            </form>
                          ) : (
                            <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg group hover:bg-slate-50 dark:hover:bg-dm-elevated ${ticketLabelIds.has(lbl.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                              <button
                                onClick={() => toggleLabel(lbl.id)}
                                className="flex items-center gap-2 flex-1 text-left min-w-0"
                              >
                                <span className="w-9 h-6 rounded flex-shrink-0" style={{ backgroundColor: lbl.color }} />
                                <span className="flex-1 text-[13px] text-slate-800 dark:text-dm-text truncate">{lbl.name}</span>
                                {ticketLabelIds.has(lbl.id) && (
                                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                              </button>
                              <button
                                onClick={(e) => openLabelEdit(e, lbl)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center text-slate-400 dark:text-dm-soft hover:text-slate-700 dark:hover:text-dm-text hover:bg-gray-200 dark:hover:bg-dm-elevated rounded"
                                title="Edit label"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="px-2 pb-2 border-t border-gray-100 dark:border-dm-border pt-2">
                      {!showLabelForm ? (
                        <button onClick={() => { setShowLabelForm(true); setEditingLabelId(null); }} className="w-full text-[13px] text-slate-500 dark:text-dm-soft hover:bg-slate-50 dark:hover:bg-dm-elevated px-2 py-1.5 rounded-lg text-left">+ Create a new label</button>
                      ) : (
                        <form onSubmit={handleCreateLabel} className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <input type="color" className="w-8 h-8 rounded cursor-pointer border border-gray-200 flex-shrink-0" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} />
                            <input className={`${INPUT_CLS} flex-1`} placeholder="Label name" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} autoFocus />
                          </div>
                          <div className="flex gap-1.5">
                            <button type="submit" className="text-xs bg-[#15803d] text-white px-3 py-1.5 rounded-full font-medium hover:bg-[#16a34a]">Create</button>
                            <button type="button" onClick={() => setShowLabelForm(false)} className="text-xs text-slate-500 dark:text-dm-soft hover:underline px-2">Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Description ── */}
                <div className="ml-7">
                  <SectionHead
                    icon={Icon.desc}
                    title="Description"
                    action={!editingDesc && (
                      <button onClick={() => setEditingDesc(true)}
                        className="px-3 py-1 text-[13px] font-medium bg-slate-100 dark:bg-dm-elevated hover:bg-slate-200 dark:hover:bg-dm-elevated text-slate-700 dark:text-dm-text rounded-full transition-colors">
                        Edit
                      </button>
                    )}
                  />
                  {editingDesc ? (
                    <div className="space-y-2">
                      <div
                        ref={descRef}
                        contentEditable
                        suppressContentEditableWarning
                        onPaste={handleDescPaste}
                        className={`${INPUT_CLS} min-h-[100px] overflow-auto`}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleDescSave} className="px-3 py-1.5 bg-[#15803d] text-white rounded-full text-sm font-medium hover:bg-[#16a34a]">Save</button>
                        <button onClick={handleDescCancel} className="px-3 py-1.5 text-slate-500 dark:text-dm-soft rounded-full text-sm hover:bg-slate-100 dark:hover:bg-dm-elevated">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setEditingDesc(true)}
                      className="text-sm text-slate-700 dark:text-dm-text cursor-pointer rounded-lg px-2 py-1.5 -ml-2 hover:bg-slate-50 dark:hover:bg-dm-card transition-colors min-h-[52px]">
                      {renderDescWithImages(desc)}
                    </div>
                  )}
                </div>

                {/* ── Checklist ── */}
                <div className="ml-7">
                  <SectionHead icon={Icon.check} title={`Checklist${totalTasks ? ` (${doneTasks}/${totalTasks})` : ''}`} />
                  {totalTasks > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-dm-soft w-7 text-right">{pct}%</span>
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-dm-elevated rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1 mb-3">
                        {tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2.5 group py-0.5">
                            <input type="checkbox" checked={task.done} onChange={() => handleToggleTask(task)}
                              className="accent-emerald-600 cursor-pointer flex-shrink-0 w-4 h-4 focus:ring-2 focus:ring-emerald-500" />
                            <span className={`flex-1 text-[13px] ${task.done ? 'line-through text-slate-400 dark:text-dm-soft' : 'text-slate-800 dark:text-dm-text'}`}>
                              {task.title}
                            </span>
                            <button onClick={() => handleDeleteTask(task)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity text-xs">✕</button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <form onSubmit={handleAddTask} className="flex gap-2">
                    <input className={`${INPUT_CLS} flex-1`} placeholder="Add an item…" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                    <button type="submit" disabled={!newTask.trim()}
                      className="px-3 py-2 bg-[#15803d] text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-[#16a34a] flex-shrink-0">Add</button>
                  </form>
                </div>

                {/* ── Attachments ── */}
                <div className="ml-7">
                  <SectionHead icon={Icon.attach} title="Attachments" />
                  {attachments.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-dm-card rounded-xl group border border-slate-100 dark:border-dm-border">
                          <div className="w-10 h-7 bg-slate-200 dark:bg-dm-elevated rounded flex items-center justify-center flex-shrink-0 text-xs">
                            {att.is_link ? '🔗' : '📎'}
                          </div>
                          <a href={att.url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline truncate font-medium">{att.name}</a>
                          <button onClick={() => mutations.deleteAttachment.mutate({ attachmentId: att.id, ticketId: ticket.id })}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAttachForm ? (
                    <form onSubmit={handleAddAttachment} className="space-y-2">
                      <input className={INPUT_CLS} placeholder="Display name" value={newAttachName} onChange={(e) => setNewAttachName(e.target.value)} autoFocus />
                      <input className={INPUT_CLS} placeholder="URL (https://…)" value={newAttachUrl} onChange={(e) => setNewAttachUrl(e.target.value)} type="url" />
                      <div className="flex gap-2">
                        <button type="submit" className="text-xs bg-[#15803d] text-white px-3 py-1.5 rounded-full font-medium hover:bg-[#16a34a]">Attach</button>
                        <button type="button" onClick={() => setShowAttachForm(false)} className="text-xs text-slate-500 dark:text-dm-soft hover:underline">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowAttachForm(true)}
                      className="text-[13px] font-medium text-slate-500 dark:text-dm-soft bg-slate-100 dark:bg-dm-elevated hover:bg-slate-200 dark:hover:bg-dm-elevated px-3 py-1.5 rounded-full transition-colors">
                      + Add link
                    </button>
                  )}
                </div>

                {/* ── Add to card (utility row at bottom) ── */}
                <div className="ml-7 pt-1 border-t border-slate-100 dark:border-dm-border">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-dm-muted uppercase tracking-wider mb-2">Add to card</p>
                  <div className="flex flex-wrap gap-1.5">
                    <ActionChip onClick={() => { setShowUserPicker((v) => !v); setShowLabelPicker(false); }} icon={Icon.user} active={showUserPicker}>Members</ActionChip>
                    <ActionChip onClick={() => { setShowLabelPicker((v) => !v); setShowUserPicker(false); }} icon={Icon.label} active={showLabelPicker}>Labels</ActionChip>
                    <ActionChip onClick={() => setShowAttachForm((v) => !v)} icon={Icon.attach} active={showAttachForm}>Attachment</ActionChip>
                  </div>
                </div>

                {/* Mark complete + Archive + saving state */}
                <div className="ml-7 flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    onClick={() => mutations.updateTicket.mutate({ ticketId: ticket.id, data: { is_completed: !ticket?.is_completed } })}
                    className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                      ticket?.is_completed
                        ? 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300'
                        : 'text-slate-500 hover:text-emerald-600 dark:text-dm-muted dark:hover:text-emerald-400'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={ticket?.is_completed ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                    {ticket?.is_completed ? 'Completed' : 'Mark complete'}
                  </button>
                  <span className="text-slate-300 dark:text-dm-border text-xs">·</span>
                  <button onClick={handleArchive} className="text-xs text-red-400 hover:text-red-600 hover:underline">Archive this card</button>
                  {saving && <span className="text-xs text-slate-400 dark:text-dm-soft">Saving…</span>}
                </div>
              </>
            )}
          </div>

          {/* ══ RIGHT: comments sidebar with distinct background ══ */}
          <div className="w-[260px] flex-shrink-0 bg-slate-50 dark:bg-dm-card border-l border-slate-200 dark:border-dm-border px-4 pt-12 pb-6 space-y-4">
            <div className="flex items-center gap-2 pt-1">
              {Icon.comment}
              <h4 className="text-[14px] font-semibold text-slate-900 dark:text-dm-text">Activity</h4>
            </div>

            {/* Comment input */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="flex gap-2 items-start">
                {me && <div className="flex-shrink-0 pt-0.5"><AvatarCircle user={me} size="sm" /></div>}
                <textarea
                  className="flex-1 px-3 py-2 text-[13px] border border-slate-200 dark:border-dm-border rounded-xl bg-white dark:bg-dm-elevated resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 dark:text-dm-text"
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e); } }}
                />
              </div>
              {newComment.trim() && (
                <div className="flex gap-1.5 pl-10">
                  <button type="submit" className="px-3 py-1.5 bg-[#15803d] text-white rounded-full text-xs font-medium hover:bg-[#16a34a]">Save</button>
                  <button type="button" onClick={() => setNewComment('')} className="px-2 py-1.5 text-slate-500 dark:text-dm-soft text-xs hover:bg-slate-100 dark:hover:bg-dm-elevated rounded-full">Cancel</button>
                </div>
              )}
            </form>

            {/* Comment list */}
            <div className="space-y-4">
              {comments.map((c) => {
                const u = c.users || c;
                const isMine = String(c.user_id) === String(me?.id);
                return (
                  <div key={c.id} className="flex gap-2 items-start">
                    <div className="flex-shrink-0"><AvatarCircle user={u} size="sm" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
                        <span className="text-[12px] font-bold text-slate-900 dark:text-dm-text">{u.username || u.full_name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-dm-soft">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="space-y-1.5">
                          <textarea className={`${INPUT_CLS} min-h-[56px] resize-none text-xs`} value={editingCommentBody}
                            onChange={(e) => setEditingCommentBody(e.target.value)} autoFocus />
                          <div className="flex gap-1.5">
                            <button onClick={() => handleSaveComment(c.id)} className="text-xs bg-[#15803d] text-white px-2.5 py-1 rounded-full font-medium hover:bg-[#16a34a]">Save</button>
                            <button onClick={() => setEditingCommentId(null)} className="text-xs text-slate-500 dark:text-dm-soft">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-dm-elevated border border-slate-200 dark:border-dm-border rounded-xl px-3 py-2 text-[12px] text-slate-700 dark:text-dm-text whitespace-pre-wrap break-words">
                          {c.body}
                        </div>
                      )}
                      {isMine && editingCommentId !== c.id && (
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => { setEditingCommentId(c.id); setEditingCommentBody(c.body); }} className="text-[11px] text-slate-400 dark:text-dm-soft hover:underline">Edit</button>
                          <span className="text-slate-300 dark:text-dm-border">·</span>
                          <button onClick={() => mutations.deleteComment.mutate({ commentId: c.id, ticketId: ticket.id })} className="text-[11px] text-slate-400 dark:text-dm-soft hover:text-red-500 hover:underline">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
