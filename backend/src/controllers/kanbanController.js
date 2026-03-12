import { supabase } from '../config/database.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const updateTaskCounts = async (ticketId) => {
  const { data: tasks } = await supabase
    .from('kanban_tasks')
    .select('done')
    .eq('ticket_id', ticketId);
  if (!tasks) return;
  await supabase
    .from('kanban_tickets')
    .update({
      tasks_total: tasks.length,
      tasks_done: tasks.filter((t) => t.done).length,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);
};

// ── Boards ───────────────────────────────────────────────────────────────────

export const getBoards = async (req, res) => {
  const { data, error } = await supabase
    .from('kanban_boards')
    .select('*')
    .eq('team_id', req.user.team_id)
    .order('created_at');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const createBoard = async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });

  const { data: board, error } = await supabase
    .from('kanban_boards')
    .insert({ name: name.trim(), description: description || null, created_by: req.user.id, team_id: req.user.team_id })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  // seed default columns
  await supabase.from('kanban_columns').insert([
    { board_id: board.id, name: 'To Do',     position: 1000, color: '#6B7280' },
    { board_id: board.id, name: 'To Review', position: 2000, color: '#F59E0B' },
    { board_id: board.id, name: 'Done',      position: 3000, color: '#10B981' }
  ]);

  return res.status(201).json({ success: true, data: board });
};

export const getBoardWithColumns = async (req, res) => {
  const { boardId } = req.params;

  const { data: board, error: boardErr } = await supabase
    .from('kanban_boards')
    .select('*')
    .eq('id', boardId)
    .eq('team_id', req.user.team_id)
    .single();
  if (boardErr) return res.status(404).json({ success: false, message: 'Board not found' });

  const [{ data: columns, error: colErr }, { data: tickets, error: tickErr }] = await Promise.all([
    supabase.from('kanban_columns').select('*').eq('board_id', boardId).order('position'),
    supabase
      .from('kanban_tickets')
      .select(`
        *,
        assignees:kanban_ticket_assignees(user_id, users(id, full_name, username, profile_picture)),
        labels:kanban_ticket_labels(label_id, kanban_labels(id, name, color))
      `)
      .eq('board_id', boardId)
      .eq('archived', false)
      .order('position')
  ]);

  if (colErr)  return res.status(500).json({ success: false, message: colErr.message });
  if (tickErr) return res.status(500).json({ success: false, message: tickErr.message });

  const columnsWithTickets = (columns || []).map((col) => ({
    ...col,
    tickets: (tickets || []).filter((t) => t.column_id === col.id)
  }));

  return res.json({ success: true, data: { board, columns: columnsWithTickets } });
};

export const updateBoard = async (req, res) => {
  const { boardId } = req.params;
  const { name, description } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('kanban_boards')
    .update(updates)
    .eq('id', boardId)
    .eq('team_id', req.user.team_id)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const deleteBoard = async (req, res) => {
  const { boardId } = req.params;
  const { error } = await supabase.from('kanban_boards').delete().eq('id', boardId).eq('team_id', req.user.team_id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Board deleted' });
};

// ── Columns ──────────────────────────────────────────────────────────────────

export const createColumn = async (req, res) => {
  const { boardId } = req.params;
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });

  const { data: last } = await supabase
    .from('kanban_columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1);
  const maxPos = last?.[0]?.position ?? 0;

  const { data, error } = await supabase
    .from('kanban_columns')
    .insert({ board_id: boardId, name: name.trim(), position: maxPos + 1000, color: color || '#6B7280' })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, data: { ...data, tickets: [] } });
};

export const updateColumn = async (req, res) => {
  const { columnId } = req.params;
  const updates = {};
  if (req.body.name  !== undefined) updates.name  = req.body.name.trim();
  if (req.body.color !== undefined) updates.color = req.body.color;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('kanban_columns')
    .update(updates)
    .eq('id', columnId)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const deleteColumn = async (req, res) => {
  const { columnId } = req.params;
  // Archive all tickets before deleting column
  await supabase
    .from('kanban_tickets')
    .update({ archived: true, archived_at: new Date().toISOString() })
    .eq('column_id', columnId);

  const { error } = await supabase.from('kanban_columns').delete().eq('id', columnId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Column deleted (tickets archived)' });
};

export const reorderColumns = async (req, res) => {
  const { columns } = req.body; // [{ id, position }]
  if (!Array.isArray(columns)) return res.status(400).json({ success: false, message: 'columns array required' });

  await Promise.all(
    columns.map(({ id, position }) =>
      supabase.from('kanban_columns').update({ position, updated_at: new Date().toISOString() }).eq('id', id)
    )
  );
  return res.json({ success: true });
};

// ── Tickets ──────────────────────────────────────────────────────────────────

export const createTicket = async (req, res) => {
  const { boardId } = req.params;
  const { column_id, title, description, due_date, cover_color } = req.body;
  if (!title?.trim())  return res.status(400).json({ success: false, message: 'Title is required' });
  if (!column_id)      return res.status(400).json({ success: false, message: 'column_id is required' });

  const { data: last } = await supabase
    .from('kanban_tickets')
    .select('position')
    .eq('column_id', column_id)
    .eq('archived', false)
    .order('position', { ascending: false })
    .limit(1);
  const maxPos = last?.[0]?.position ?? 0;

  const { data, error } = await supabase
    .from('kanban_tickets')
    .insert({
      board_id:    boardId,
      column_id,
      title:       title.trim(),
      description: description || null,
      position:    maxPos + 1000,
      due_date:    due_date || null,
      cover_color: cover_color || null,
      created_by:  req.user.id
    })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, data: { ...data, assignees: [], labels: [] } });
};

export const getTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { data, error } = await supabase
    .from('kanban_tickets')
    .select(`
      *,
      assignees:kanban_ticket_assignees(user_id, users(id, full_name, username, profile_picture)),
      labels:kanban_ticket_labels(label_id, kanban_labels(id, name, color)),
      tasks:kanban_tasks(*),
      attachments:kanban_attachments(*, users(id, full_name, username)),
      comments:kanban_comments(*, users(id, full_name, username, profile_picture))
    `)
    .eq('id', ticketId)
    .single();
  if (error) return res.status(404).json({ success: false, message: 'Ticket not found' });
  return res.json({ success: true, data });
};

export const updateTicket = async (req, res) => {
  const { ticketId } = req.params;
  const allowed = ['title', 'description', 'due_date', 'cover_color', 'column_id', 'position'];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('kanban_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const archiveTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { data, error } = await supabase
    .from('kanban_tickets')
    .update({ archived: true, archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const moveTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { column_id, position } = req.body;
  const { data, error } = await supabase
    .from('kanban_tickets')
    .update({ column_id, position, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const getCalendarTickets = async (req, res) => {
  const { boardId, year, month } = req.query;

  // Scope to boards belonging to user's team
  let boardQuery = supabase
    .from('kanban_boards')
    .select('id')
    .eq('team_id', req.user.team_id);
  if (boardId) boardQuery = boardQuery.eq('id', boardId);

  const { data: teamBoards } = await boardQuery;
  const teamBoardIds = (teamBoards || []).map((b) => b.id);

  if (teamBoardIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  let query = supabase
    .from('kanban_tickets')
    .select(`
      id, title, due_date, cover_color, column_id, board_id,
      labels:kanban_ticket_labels(label_id, kanban_labels(id, name, color))
    `)
    .in('board_id', teamBoardIds)
    .eq('archived', false)
    .not('due_date', 'is', null)
    .order('due_date');

  if (year && month) {
    const y = String(year).padStart(4, '0');
    const m = String(month).padStart(2, '0');
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    query = query.gte('due_date', `${y}-${m}-01`).lte('due_date', `${y}-${m}-${lastDay}`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

// ── Assignees ────────────────────────────────────────────────────────────────

export const addAssignee = async (req, res) => {
  const { ticketId } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id required' });
  const { error } = await supabase
    .from('kanban_ticket_assignees')
    .insert({ ticket_id: ticketId, user_id });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true });
};

export const removeAssignee = async (req, res) => {
  const { ticketId, userId } = req.params;
  const { error } = await supabase
    .from('kanban_ticket_assignees')
    .delete()
    .eq('ticket_id', ticketId)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
};

// ── Labels ───────────────────────────────────────────────────────────────────

export const getLabels = async (req, res) => {
  const { boardId } = req.params;
  const { data, error } = await supabase
    .from('kanban_labels')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const createLabel = async (req, res) => {
  const { boardId } = req.params;
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name required' });
  const { data, error } = await supabase
    .from('kanban_labels')
    .insert({ board_id: boardId, name: name.trim(), color: color || '#3B82F6' })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, data });
};

export const updateLabel = async (req, res) => {
  const { labelId } = req.params;
  const updates = {};
  if (req.body.name  !== undefined) updates.name  = req.body.name.trim();
  if (req.body.color !== undefined) updates.color = req.body.color;
  const { data, error } = await supabase
    .from('kanban_labels')
    .update(updates)
    .eq('id', labelId)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const deleteLabel = async (req, res) => {
  const { labelId } = req.params;
  const { error } = await supabase.from('kanban_labels').delete().eq('id', labelId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
};

export const addLabelToTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { label_id } = req.body;
  if (!label_id) return res.status(400).json({ success: false, message: 'label_id required' });
  const { error } = await supabase
    .from('kanban_ticket_labels')
    .insert({ ticket_id: ticketId, label_id });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true });
};

export const removeLabelFromTicket = async (req, res) => {
  const { ticketId, labelId } = req.params;
  const { error } = await supabase
    .from('kanban_ticket_labels')
    .delete()
    .eq('ticket_id', ticketId)
    .eq('label_id', labelId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
};

// ── Tasks ────────────────────────────────────────────────────────────────────

export const createTask = async (req, res) => {
  const { ticketId } = req.params;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title required' });

  const { data: last } = await supabase
    .from('kanban_tasks')
    .select('position')
    .eq('ticket_id', ticketId)
    .order('position', { ascending: false })
    .limit(1);
  const maxPos = last?.[0]?.position ?? 0;

  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert({ ticket_id: ticketId, title: title.trim(), position: maxPos + 1000 })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  await updateTaskCounts(ticketId);
  return res.status(201).json({ success: true, data });
};

export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updates = {};
  if (req.body.title    !== undefined) updates.title    = req.body.title.trim();
  if (req.body.done     !== undefined) updates.done     = req.body.done;
  if (req.body.position !== undefined) updates.position = req.body.position;

  const { data, error } = await supabase
    .from('kanban_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  await updateTaskCounts(data.ticket_id);
  return res.json({ success: true, data });
};

export const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  const { data: task } = await supabase.from('kanban_tasks').select('ticket_id').eq('id', taskId).single();
  const { error } = await supabase.from('kanban_tasks').delete().eq('id', taskId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (task?.ticket_id) await updateTaskCounts(task.ticket_id);
  return res.json({ success: true });
};

// ── Attachments ──────────────────────────────────────────────────────────────

export const addAttachment = async (req, res) => {
  const { ticketId } = req.params;
  const { name, url, is_link } = req.body;
  if (!name?.trim() || !url?.trim())
    return res.status(400).json({ success: false, message: 'name and url are required' });

  const { data, error } = await supabase
    .from('kanban_attachments')
    .insert({
      ticket_id:  ticketId,
      name:       name.trim(),
      url:        url.trim(),
      is_link:    !!is_link,
      created_by: req.user.id
    })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, data });
};

export const deleteAttachment = async (req, res) => {
  const { attachmentId } = req.params;
  const { error } = await supabase.from('kanban_attachments').delete().eq('id', attachmentId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
};

// ── Comments ─────────────────────────────────────────────────────────────────

export const getComments = async (req, res) => {
  const { ticketId } = req.params;
  const { data, error } = await supabase
    .from('kanban_comments')
    .select('*, users(id, full_name, username, profile_picture)')
    .eq('ticket_id', ticketId)
    .order('created_at');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const createComment = async (req, res) => {
  const { ticketId } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ success: false, message: 'Body required' });
  const { data, error } = await supabase
    .from('kanban_comments')
    .insert({ ticket_id: ticketId, user_id: req.user.id, body: body.trim() })
    .select('*, users(id, full_name, username, profile_picture)')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, data });
};

export const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ success: false, message: 'Body required' });
  const { data, error } = await supabase
    .from('kanban_comments')
    .update({ body: body.trim(), updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', req.user.id) // only own comments
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { error } = await supabase
    .from('kanban_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', req.user.id); // only own comments
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
};

// ── Users (for assignee picker) ───────────────────────────────────────────────

export const getUsers = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, username, profile_picture')
    .eq('team_id', req.user.team_id)
    .order('full_name');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
};
