import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getBoards, createBoard, getBoardWithColumns, updateBoard, deleteBoard,
  createColumn, updateColumn, deleteColumn, reorderColumns,
  createTicket, getTicket, updateTicket, archiveTicket, moveTicket, getCalendarTickets,
  addAssignee, removeAssignee,
  getLabels, createLabel, updateLabel, deleteLabel, addLabelToTicket, removeLabelFromTicket,
  createTask, updateTask, deleteTask,
  addAttachment, deleteAttachment,
  getComments, createComment, updateComment, deleteComment,
  getUsers
} from '../controllers/kanbanController.js';

const router = express.Router();
router.use(protect);

// Boards
router.get('/boards',          getBoards);
router.post('/boards',         createBoard);
router.get('/boards/:boardId', getBoardWithColumns);
router.put('/boards/:boardId', updateBoard);
router.delete('/boards/:boardId', deleteBoard);

// Columns
router.post('/boards/:boardId/columns', createColumn);
router.put('/columns/:columnId',    updateColumn);
router.delete('/columns/:columnId', deleteColumn);
router.post('/columns/reorder',     reorderColumns);

// Tickets – calendar must come before :ticketId to avoid parameter collision
router.get('/tickets/calendar',          getCalendarTickets);
router.post('/boards/:boardId/tickets',  createTicket);
router.get('/tickets/:ticketId',         getTicket);
router.put('/tickets/:ticketId',         updateTicket);
router.patch('/tickets/:ticketId/archive', archiveTicket);
router.patch('/tickets/:ticketId/move',    moveTicket);

// Assignees
router.post('/tickets/:ticketId/assignees',           addAssignee);
router.delete('/tickets/:ticketId/assignees/:userId', removeAssignee);

// Labels
router.get('/boards/:boardId/labels',    getLabels);
router.post('/boards/:boardId/labels',   createLabel);
router.put('/labels/:labelId',           updateLabel);
router.delete('/labels/:labelId',        deleteLabel);
router.post('/tickets/:ticketId/labels',           addLabelToTicket);
router.delete('/tickets/:ticketId/labels/:labelId', removeLabelFromTicket);

// Tasks
router.post('/tickets/:ticketId/tasks', createTask);
router.put('/tasks/:taskId',            updateTask);
router.delete('/tasks/:taskId',         deleteTask);

// Attachments
router.post('/tickets/:ticketId/attachments',  addAttachment);
router.delete('/attachments/:attachmentId',    deleteAttachment);

// Comments
router.get('/tickets/:ticketId/comments',    getComments);
router.post('/tickets/:ticketId/comments',   createComment);
router.put('/comments/:commentId',           updateComment);
router.delete('/comments/:commentId',        deleteComment);

// Users (for assignee picker)
router.get('/users', getUsers);

export default router;
