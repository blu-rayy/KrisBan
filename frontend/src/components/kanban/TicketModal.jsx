import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useKanbanMutations, useKanbanUsers, useLabels, useTicket } from '../../hooks/useKanban';
import { getInitials } from './TicketCard';

const COVER_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#6B7280', '#1E293B'
];

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-200 dark:border-dm-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white dark:bg-dm-elevated dark:text-dm-text';

// ── Sub-components ────────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold text-gray-400 dark:text-dm-soft uppercase tracking-wider">{title}</h4>
    {children}
  </div>
);

const AvatarCircle = ({ user, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-full bg-blue-500 text-white font-bold flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {user.profile_picture ? (
        <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
      ) : getInitials(user)}
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

export const TicketModal = ({ ticketId, boardId, onClose }) => {
  const { user: me } = useContext(AuthContext);
  const { data: ticket, isLoading } = useTicket(ticketId);
  const { data: allUsers = [] } = useKanbanUsers();
  const { data: boardLabels = [] } = useLabels(boardId);
  const mutations = useKanbanMutations(boardId);

  const [title, setTitle]           = useState('');
  const [desc,  setDesc]            = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [coverColor, setCoverColor] = useState('');
  const [newTask, setNewTask]       = useState('');
  const [newComment, setNewComment] = useState('');
  const [newAttachName, setNewAttachName] = useState('');
  const [newAttachUrl,  setNewAttachUrl]  = useState('');
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  // Populate form when ticket loads
  useEffect(() => {
    if (!ticket) return;
    setTitle(ticket.title || '');
    setDesc(ticket.description || '');
    setDueDate(ticket.due_date || '');
    setCoverColor(ticket.cover_color || '');
  }, [ticket]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveField = async (field, value) => {
    if (!ticket) return;
    setSaving(true);
    try {
      await mutations.updateTicket.mutateAsync({ ticketId: ticket.id, data: { [field]: value || null } });
    } finally {
      setSaving(false);
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== ticket?.title) saveField('title', title.trim());
  };

  const handleDescBlur = () => {
    if (desc !== (ticket?.description || '')) saveField('description', desc);
  };

  const handleDueDateChange = (e) => {
    setDueDate(e.target.value);
    saveField('due_date', e.target.value || null);
  };

  const handleCoverColor = (color) => {
    const next = coverColor === color ? '' : color;
    setCoverColor(next);
    saveField('cover_color', next || null);
  };

  const assigneeIds = new Set((ticket?.assignees || []).map((a) => a.user_id));
  const ticketLabelIds = new Set((ticket?.labels || []).map((l) => l.label_id));

  const toggleAssignee = (uid) => {
    if (!ticket) return;
    if (assigneeIds.has(uid)) {
      mutations.removeAssignee.mutate({ ticketId: ticket.id, userId: uid });
    } else {
      mutations.addAssignee.mutate({ ticketId: ticket.id, userId: uid });
    }
  };

  const toggleLabel = (labelId) => {
    if (!ticket) return;
    if (ticketLabelIds.has(labelId)) {
      mutations.removeLabelFromTicket.mutate({ ticketId: ticket.id, labelId });
    } else {
      mutations.addLabelToTicket.mutate({ ticketId: ticket.id, labelId });
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !ticket) return;
    await mutations.createTask.mutateAsync({ ticketId: ticket.id, title: newTask.trim() });
    setNewTask('');
  };

  const handleToggleTask = (task) => {
    mutations.updateTask.mutate({ taskId: task.id, data: { done: !task.done } });
  };

  const handleDeleteTask = (task) => {
    mutations.deleteTask.mutate({ taskId: task.id, ticketId: ticket.id });
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!newAttachName.trim() || !newAttachUrl.trim() || !ticket) return;
    await mutations.addAttachment.mutateAsync({
      ticketId: ticket.id,
      data: { name: newAttachName.trim(), url: newAttachUrl.trim(), is_link: true }
    });
    setNewAttachName('');
    setNewAttachUrl('');
    setShowAttachForm(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
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
    setNewLabelName('');
    setShowLabelForm(false);
  };

  const handleArchive = async () => {
    if (!ticket) return;
    if (!window.confirm('Archive this ticket?')) return;
    await mutations.archiveTicket.mutateAsync(ticket.id);
    onClose();
  };

  const tasks       = [...(ticket?.tasks       || [])].sort((a, b) => a.position - b.position);
  const attachments =   (ticket?.attachments   || []);
  const comments    = [...(ticket?.comments    || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl h-full bg-white dark:bg-dm-card shadow-2xl flex flex-col overflow-hidden">
        {/* Cover */}
        {coverColor && <div className="h-3 flex-shrink-0" style={{ backgroundColor: coverColor }} />}

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center text-gray-400 dark:text-dm-soft py-20">Loading…</div>
          ) : (
            <>
              {/* Title */}
              <div className="flex items-start gap-3">
                <textarea
                  ref={titleRef}
                  className="flex-1 text-xl font-bold text-gray-900 dark:text-dm-text resize-none border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-dm-card rounded-lg px-1 min-h-[2.5rem]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  rows={1}
                />
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-dm-text text-xl leading-none mt-1">✕</button>
              </div>

              {/* Cover Colors */}
              <Section title="Cover">
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleCoverColor(c)}
                      className="w-7 h-7 rounded-md ring-offset-1 transition-all"
                      style={{
                        backgroundColor: c,
                        outline: coverColor === c ? `3px solid ${c}` : 'none',
                        outlineOffset: '2px'
                      }}
                    />
                  ))}
                  {coverColor && (
                    <button
                      onClick={() => handleCoverColor('')}
                      className="w-7 h-7 rounded-md bg-gray-100 dark:bg-dm-elevated text-gray-500 dark:text-dm-muted text-xs font-semibold hover:bg-gray-200 dark:hover:bg-dm-elevated/80"
                    >✕</button>
                  )}
                </div>
              </Section>

              {/* Due Date */}
              <Section title="Due Date">
                <input
                  type="date"
                  className={INPUT_CLS}
                  value={dueDate}
                  onChange={handleDueDateChange}
                />
              </Section>

              {/* Assignees */}
              <Section title="Assignees">
                <div className="flex flex-wrap gap-2 items-center">
                  {(ticket?.assignees || []).map((a) => {
                    const u = a.users || a;
                    return (
                      <div key={a.user_id} className="flex items-center gap-1.5 bg-gray-100 dark:bg-dm-elevated rounded-full pl-1 pr-2 py-0.5">
                        <AvatarCircle user={u} size="sm" />
                        <span className="text-xs text-gray-700 dark:text-dm-text">{u.full_name || u.username}</span>
                        <button
                          onClick={() => toggleAssignee(a.user_id)}
                          className="text-gray-400 hover:text-red-500 leading-none"
                        >✕</button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setShowUserPicker((v) => !v)}
                    className="text-xs text-blue-600 hover:underline"
                  >+ Add</button>
                </div>
                {showUserPicker && (
                  <div className="border border-gray-200 dark:border-dm-border rounded-xl bg-white dark:bg-dm-card shadow-lg max-h-44 overflow-y-auto mt-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => toggleAssignee(u.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dm-elevated dark:text-dm-text ${assigneeIds.has(u.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <AvatarCircle user={u} size="sm" />
                        <span className="flex-1 text-left">{u.full_name || u.username}</span>
                        {assigneeIds.has(u.id) && <span className="text-blue-500 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              {/* Labels */}
              <Section title="Labels">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(ticket?.labels || []).map((l) => {
                    const lbl = l.kanban_labels || l;
                    return (
                      <span
                        key={l.label_id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-semibold cursor-pointer"
                        style={{ backgroundColor: lbl.color }}
                        onClick={() => toggleLabel(l.label_id)}
                        title="Click to remove"
                      >
                        {lbl.name} ✕
                      </span>
                    );
                  })}
                  <button
                    onClick={() => setShowLabelPicker((v) => !v)}
                    className="text-xs text-blue-600 hover:underline"
                  >+ Label</button>
                </div>
                {showLabelPicker && (
                  <div className="border border-gray-200 dark:border-dm-border rounded-xl bg-white dark:bg-dm-card shadow-lg p-2 mt-1 space-y-1">
                    {boardLabels.map((lbl) => (
                      <button
                        key={lbl.id}
                        onClick={() => toggleLabel(lbl.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dm-elevated dark:text-dm-text ${ticketLabelIds.has(lbl.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: lbl.color }} />
                        <span className="flex-1 text-left">{lbl.name}</span>
                        {ticketLabelIds.has(lbl.id) && <span className="text-blue-500 text-xs">✓</span>}
                      </button>
                    ))}
                    {!showLabelForm && (
                      <button
                        onClick={() => setShowLabelForm(true)}
                        className="w-full text-xs text-blue-600 hover:underline text-left px-2 py-1"
                      >+ Create label</button>
                    )}
                    {showLabelForm && (
                      <form onSubmit={handleCreateLabel} className="space-y-1 pt-1">
                        <input
                          className={INPUT_CLS}
                          placeholder="Label name"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                          />
                          <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">Save</button>
                          <button type="button" onClick={() => setShowLabelForm(false)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </Section>

              {/* Description */}
              <Section title="Description">
                <textarea
                  className={`${INPUT_CLS} min-h-[80px] resize-y`}
                  placeholder="Add a description…"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  onBlur={handleDescBlur}
                />
              </Section>

              {/* Checklist */}
              <Section title={`Checklist ${tasks.length ? `(${ticket?.tasks_done}/${ticket?.tasks_total})` : ''}`}>
                {tasks.length > 0 && (
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleTask(task)}
                          className="accent-blue-600 cursor-pointer flex-shrink-0"
                        />
                          <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-dm-text'}`}>
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity text-xs"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    className={`${INPUT_CLS} flex-1`}
                    placeholder="Add a task…"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newTask.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-blue-700"
                  >Add</button>
                </form>
              </Section>

              {/* Attachments */}
              <Section title="Attachments">
                {attachments.length > 0 && (
                  <div className="space-y-1.5">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-dm-elevated rounded-lg group">
                        <span className="text-lg">{att.is_link ? '🔗' : '📎'}</span>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-blue-600 hover:underline truncate"
                        >{att.name}</a>
                        <button
                          onClick={() => mutations.deleteAttachment.mutate({ attachmentId: att.id, ticketId: ticket.id })}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity text-xs"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {!showAttachForm ? (
                  <button
                    onClick={() => setShowAttachForm(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >+ Add link</button>
                ) : (
                  <form onSubmit={handleAddAttachment} className="space-y-2">
                    <input
                      className={INPUT_CLS}
                      placeholder="Name"
                      value={newAttachName}
                      onChange={(e) => setNewAttachName(e.target.value)}
                      autoFocus
                    />
                    <input
                      className={INPUT_CLS}
                      placeholder="URL (https://…)"
                      value={newAttachUrl}
                      onChange={(e) => setNewAttachUrl(e.target.value)}
                      type="url"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">Add</button>
                      <button type="button" onClick={() => setShowAttachForm(false)} className="text-xs text-gray-500">Cancel</button>
                    </div>
                  </form>
                )}
              </Section>

              {/* Comments */}
              <Section title="Activity">
                {comments.length > 0 && (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const u = c.users || c;
                      const isMine = String(c.user_id) === String(me?.id);
                      return (
                        <div key={c.id} className="flex gap-2.5">
                          <AvatarCircle user={u} size="sm" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-gray-700 dark:text-dm-text">{u.full_name || u.username}</span>
                              <span className="text-[10px] text-gray-400 dark:text-dm-soft">
                                {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {editingCommentId === c.id ? (
                              <div className="space-y-1">
                                <textarea
                                  className={`${INPUT_CLS} min-h-[60px] resize-none`}
                                  value={editingCommentBody}
                                  onChange={(e) => setEditingCommentBody(e.target.value)}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleSaveComment(c.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                                  <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-500">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 dark:text-dm-muted whitespace-pre-wrap">{c.body}</p>
                            )}
                            {isMine && editingCommentId !== c.id && (
                              <div className="flex gap-2 mt-0.5">
                                <button onClick={() => { setEditingCommentId(c.id); setEditingCommentBody(c.body); }} className="text-[10px] text-gray-400 hover:text-blue-500">Edit</button>
                                <button onClick={() => mutations.deleteComment.mutate({ commentId: c.id, ticketId: ticket.id })} className="text-[10px] text-gray-400 hover:text-red-500">Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <textarea
                    className={`${INPUT_CLS} flex-1 resize-none`}
                    placeholder="Write a comment…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e); }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-blue-700 self-end"
                  >Post</button>
                </form>
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        {ticket && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-dm-border flex justify-between items-center bg-gray-50 dark:bg-dm-elevated">
            <span className="text-xs text-gray-400 dark:text-dm-soft">
              {saving ? 'Saving…' : 'Changes saved automatically'}
            </span>
            <button
              onClick={handleArchive}
              className="text-xs text-red-400 hover:text-red-600 hover:underline"
            >Archive ticket</button>
          </div>
        )}
      </div>
    </div>
  );
};
