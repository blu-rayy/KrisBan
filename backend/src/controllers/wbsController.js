import WbsState from '../models/WbsState.js';

// Deterministic-ish fresh ID — no external deps needed
const freshId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const VALID_STATUSES = new Set(['todo', 'in-progress', 'gate', 'done']);
const VALID_CATEGORIES = new Set([
  'Backend', 'Training', 'Documentation',
  'Infrastructure', 'Evaluation', 'Frontend', 'Externals',
]);

// Remap a node tree, generating fresh IDs and stripping unknown fields
const remapNode = (node, level) => {
  const out = {
    id: freshId(`l${level}`),
    label: typeof node.label === 'string' && node.label.trim() ? node.label.trim() : 'Untitled',
    level,
    assigneeId: typeof node.assigneeId === 'string' ? node.assigneeId : null,
  };

  if (level === 2) {
    if (node.status && VALID_STATUSES.has(node.status)) out.status = node.status;
    if (typeof node.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(node.day)) out.day = node.day;
    if (node.category && VALID_CATEGORIES.has(node.category)) out.category = node.category;
    if ([1, 2, 3, 4].includes(node.priority)) out.priority = node.priority;
    if (typeof node.note === 'string' && node.note.trim()) out.note = node.note.trim();
  }

  // Only L1 nodes carry children; L2 nodes are leaf nodes
  out.children = level < 2 && Array.isArray(node.children)
    ? node.children.map(c => remapNode(c, level + 1))
    : [];

  return out;
};

export const importBoard = async (req, res) => {
  try {
    const { board } = req.body;

    if (!board || typeof board !== 'object' || Array.isArray(board)) {
      return res.status(400).json({ success: false, message: 'body.board must be an object' });
    }
    if (!board.wbsData || !Array.isArray(board.wbsData.children)) {
      return res.status(400).json({ success: false, message: 'board.wbsData.children must be an array' });
    }

    const newBoard = {
      id: freshId('board'),
      name: typeof board.name === 'string' && board.name.trim() ? board.name.trim() : 'Imported Board',
      ...(board.summary        && { summary: String(board.summary) }),
      ...(board.carryForward   && { carryForward: String(board.carryForward) }),
      gates:        Array.isArray(board.gates)        ? board.gates.filter(g => g?.description)        : [],
      pinnedIssues: Array.isArray(board.pinnedIssues) ? board.pinnedIssues.filter(i => i?.description) : [],
      deliverables: Array.isArray(board.deliverables) ? board.deliverables.filter(d => d?.description) : [],
      wbsData: {
        id: 'root',
        label: typeof board.wbsData.label === 'string' && board.wbsData.label.trim()
          ? board.wbsData.label.trim()
          : 'Project',
        children: board.wbsData.children.map(c => remapNode(c, 1)),
      },
    };

    const current = await WbsState.findByUser(req.user.id);
    const existingBoards = current?.boards ?? [];
    const teamMembers    = current?.team_members ?? [];
    const activeBoardId  = current?.active_board_id ?? newBoard.id;

    await WbsState.upsert(req.user.id, {
      boards: [...existingBoards, newBoard],
      teamMembers,
      activeBoardId,
    });

    return res.json({ success: true, boardId: newBoard.id });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWbsState = async (req, res) => {
  try {
    const row = await WbsState.findByUser(req.user.id);
    return res.json({ success: true, data: row ?? null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const saveWbsState = async (req, res) => {
  try {
    const { boards, teamMembers, activeBoardId } = req.body;

    if (!Array.isArray(boards)) {
      return res.status(400).json({ success: false, message: 'boards array is required' });
    }

    const row = await WbsState.upsert(req.user.id, { boards, teamMembers: teamMembers ?? [], activeBoardId });
    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
