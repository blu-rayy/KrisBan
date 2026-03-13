import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kanbanService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ── Query keys ────────────────────────────────────────────────────────────────
export const kanbanKeys = {
  boards:   (teamId) => ['kanban', 'boards', teamId],
  board:    (id) => ['kanban', 'board', id],
  labels:   (boardId) => ['kanban', 'labels', boardId],
  ticket:   (id) => ['kanban', 'ticket', id],
  calendar: (boardId, year, month) => ['kanban', 'calendar', boardId, year, month],
  users:    (teamId) => ['kanban', 'users', teamId]
};

// ── Boards ────────────────────────────────────────────────────────────────────
export const useBoards = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;
  return useQuery({
    queryKey: kanbanKeys.boards(teamId),
    queryFn: async () => {
      const res = await kanbanService.getBoards();
      return res.data?.data || [];
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000
  });
};

export const useBoard = (boardId) =>
  useQuery({
    queryKey: kanbanKeys.board(boardId),
    queryFn: async () => {
      const res = await kanbanService.getBoard(boardId);
      return res.data?.data || { board: null, columns: [] };
    },
    enabled: !!boardId,
    staleTime: 30_000
  });

export const useLabels = (boardId) =>
  useQuery({
    queryKey: kanbanKeys.labels(boardId),
    queryFn: async () => {
      const res = await kanbanService.getLabels(boardId);
      return res.data?.data || [];
    },
    enabled: !!boardId,
    staleTime: 60_000
  });

export const useTicket = (ticketId) =>
  useQuery({
    queryKey: kanbanKeys.ticket(ticketId),
    queryFn: async () => {
      const res = await kanbanService.getTicket(ticketId);
      return res.data?.data || null;
    },
    enabled: !!ticketId,
    staleTime: 10_000
  });

export const useCalendarTickets = (boardId, year, month) =>
  useQuery({
    queryKey: kanbanKeys.calendar(boardId, year, month),
    queryFn: async () => {
      const res = await kanbanService.getCalendarTickets({ boardId, year, month });
      return res.data?.data || [];
    },
    enabled: !!boardId,
    staleTime: 30_000
  });

export const useKanbanUsers = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;
  return useQuery({
    queryKey: kanbanKeys.users(teamId),
    queryFn: async () => {
      const res = await kanbanService.getUsers();
      return res.data?.data || [];
    },
    enabled: Boolean(user?.id),
    staleTime: 300_000
  });
};

// ── Mutations ─────────────────────────────────────────────────────────────────
export const useKanbanMutations = (boardId) => {
  const qc = useQueryClient();
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;
  const invalidateBoard   = () => qc.invalidateQueries({ queryKey: kanbanKeys.board(boardId) });
  const invalidateBoards  = () => qc.invalidateQueries({ queryKey: kanbanKeys.boards(teamId) });
  const invalidateLabels  = () => qc.invalidateQueries({ queryKey: kanbanKeys.labels(boardId) });
  const invalidateTicket  = (id) => qc.invalidateQueries({ queryKey: kanbanKeys.ticket(id) });

  return {
    // Board
    createBoard: useMutation({
      mutationFn: (data) => kanbanService.createBoard(data),
      onSuccess: invalidateBoards
    }),
    updateBoard: useMutation({
      mutationFn: (data) => kanbanService.updateBoard(boardId, data),
      onSuccess: () => { invalidateBoards(); invalidateBoard(); }
    }),
    deleteBoard: useMutation({
      mutationFn: () => kanbanService.deleteBoard(boardId),
      onSuccess: invalidateBoards
    }),

    // Columns
    createColumn: useMutation({
      mutationFn: (data) => kanbanService.createColumn(boardId, data),
      onSuccess: invalidateBoard
    }),
    updateColumn: useMutation({
      mutationFn: ({ columnId, data }) => kanbanService.updateColumn(columnId, data),
      onSuccess: invalidateBoard
    }),
    deleteColumn: useMutation({
      mutationFn: (columnId) => kanbanService.deleteColumn(columnId),
      onSuccess: invalidateBoard
    }),
    reorderColumns: useMutation({
      mutationFn: (columns) => kanbanService.reorderColumns(columns),
      onSuccess: invalidateBoard
    }),

    // Tickets
    createTicket: useMutation({
      mutationFn: (data) => kanbanService.createTicket(boardId, data),
      onSuccess: invalidateBoard
    }),
    updateTicket: useMutation({
      mutationFn: ({ ticketId, data }) => kanbanService.updateTicket(ticketId, data),
      onSuccess: ({ data }) => { invalidateBoard(); invalidateTicket(data?.data?.id); }
    }),
    archiveTicket: useMutation({
      mutationFn: (ticketId) => kanbanService.archiveTicket(ticketId),
      onSuccess: invalidateBoard
    }),
    moveTicket: useMutation({
      mutationFn: ({ ticketId, data }) => kanbanService.moveTicket(ticketId, data),
      // optimistic – board already updated locally, this just persists
      onError: invalidateBoard
    }),

    // Assignees
    addAssignee: useMutation({
      mutationFn: ({ ticketId, userId }) => kanbanService.addAssignee(ticketId, userId),
      onSuccess: (_r, { ticketId }) => { invalidateBoard(); invalidateTicket(ticketId); }
    }),
    removeAssignee: useMutation({
      mutationFn: ({ ticketId, userId }) => kanbanService.removeAssignee(ticketId, userId),
      onSuccess: (_r, { ticketId }) => { invalidateBoard(); invalidateTicket(ticketId); }
    }),

    // Labels
    createLabel: useMutation({
      mutationFn: (data) => kanbanService.createLabel(boardId, data),
      onSuccess: invalidateLabels
    }),
    updateLabel: useMutation({
      mutationFn: ({ labelId, data }) => kanbanService.updateLabel(labelId, data),
      onSuccess: () => { invalidateLabels(); invalidateBoard(); }
    }),
    deleteLabel: useMutation({
      mutationFn: (labelId) => kanbanService.deleteLabel(labelId),
      onSuccess: () => { invalidateLabels(); invalidateBoard(); }
    }),
    addLabelToTicket: useMutation({
      mutationFn: ({ ticketId, labelId }) => kanbanService.addLabelToTicket(ticketId, labelId),
      onSuccess: (_r, { ticketId }) => { invalidateBoard(); invalidateTicket(ticketId); }
    }),
    removeLabelFromTicket: useMutation({
      mutationFn: ({ ticketId, labelId }) => kanbanService.removeLabelFromTicket(ticketId, labelId),
      onSuccess: (_r, { ticketId }) => { invalidateBoard(); invalidateTicket(ticketId); }
    }),

    // Tasks
    createTask: useMutation({
      mutationFn: ({ ticketId, title }) => kanbanService.createTask(ticketId, title),
      onSuccess: (_r, { ticketId }) => { invalidateTicket(ticketId); invalidateBoard(); }
    }),
    updateTask: useMutation({
      mutationFn: ({ taskId, data }) => kanbanService.updateTask(taskId, data),
      onSuccess: (_r, _v, ctx) => { if (ctx?.ticketId) invalidateTicket(ctx.ticketId); invalidateBoard(); }
    }),
    deleteTask: useMutation({
      mutationFn: ({ taskId }) => kanbanService.deleteTask(taskId),
      onSuccess: (_r, { ticketId }) => { if (ticketId) invalidateTicket(ticketId); invalidateBoard(); }
    }),

    // Attachments
    addAttachment: useMutation({
      mutationFn: ({ ticketId, data }) => kanbanService.addAttachment(ticketId, data),
      onSuccess: (_r, { ticketId }) => invalidateTicket(ticketId)
    }),
    deleteAttachment: useMutation({
      mutationFn: ({ attachmentId, ticketId }) => kanbanService.deleteAttachment(attachmentId),
      onSuccess: (_r, { ticketId }) => invalidateTicket(ticketId)
    }),

    // Comments
    createComment: useMutation({
      mutationFn: ({ ticketId, body }) => kanbanService.createComment(ticketId, body),
      onSuccess: (_r, { ticketId }) => invalidateTicket(ticketId)
    }),
    updateComment: useMutation({
      mutationFn: ({ commentId, body }) => kanbanService.updateComment(commentId, body),
      onSuccess: (_r, { ticketId }) => { if (ticketId) invalidateTicket(ticketId); }
    }),
    deleteComment: useMutation({
      mutationFn: ({ commentId }) => kanbanService.deleteComment(commentId),
      onSuccess: (_r, { ticketId }) => { if (ticketId) invalidateTicket(ticketId); }
    })
  };
};
