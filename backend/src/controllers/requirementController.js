import Requirement from '../models/Requirement.js';

// ─── Progress helpers ──────────────────────────────────────────────────────────

/**
 * Build a node tree from a flat list, computing parent progress from children.
 *
 * For a node WITH children:
 *   node.progress = Σ (child.weight / node.weight) × child.progress
 *
 * For the overall percentage:
 *   overall = Σ (root.weight × root.progress / 100)
 *
 * Assumes top-level weights sum to 100.
 */
function buildTree(flat) {
  const map = new Map();

  for (const row of flat) {
    map.set(row.id, {
      id:          row.id,
      frId:        row.fr_id,
      title:       row.title,
      description: row.description,
      weight:      Number(row.weight),
      progress:    Number(row.progress), // stored value — may be overridden below
      parentId:    row.parent_id,
      orderIndex:  row.order_index,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
      children:    []
    });
  }

  const roots = [];

  for (const node of map.values()) {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by orderIndex
  for (const node of map.values()) {
    node.children.sort((a, b) => a.orderIndex - b.orderIndex);
  }
  roots.sort((a, b) => a.orderIndex - b.orderIndex);

  // Compute progress bottom-up
  computeProgress(roots);

  return roots;
}

function computeProgress(nodes) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      computeProgress(node.children);

      if (node.weight > 0) {
        node.progress = node.children.reduce((sum, child) => {
          return sum + (child.weight / node.weight) * child.progress;
        }, 0);
      } else {
        node.progress = 0;
      }

      node.progress = Math.min(100, Math.max(0, Math.round(node.progress * 10) / 10));
    }
  }
}

function computeOverall(roots) {
  const overall = roots.reduce((sum, root) => {
    return sum + (root.weight * root.progress) / 100;
  }, 0);
  return Math.round(overall * 10) / 10;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getRequirements = async (req, res) => {
  try {
    const flat = await Requirement.findAll();
    const tree = buildTree(flat);
    const overall = computeOverall(tree);

    return res.json({ success: true, data: tree, overall });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOverallProgress = async (req, res) => {
  try {
    const flat = await Requirement.findAll();
    const tree = buildTree(flat);
    const overall = computeOverall(tree);

    return res.json({ success: true, overall });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createRequirement = async (req, res) => {
  try {
    const { frId, title, description, weight, progress, parentId, orderIndex } = req.body;

    if (!frId || !title) {
      return res.status(400).json({ success: false, message: 'frId and title are required' });
    }

    const row = await Requirement.create({ frId, title, description, weight, progress, parentId, orderIndex });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Requirement.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    const row = await Requirement.update(id, req.body);
    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Requirement.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    await Requirement.delete(id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkSeed = async (req, res) => {
  try {
    const { requirements } = req.body;
    if (!Array.isArray(requirements)) {
      return res.status(400).json({ success: false, message: 'requirements array required' });
    }

    await Requirement.deleteAll();

    // Insert top-level FRs first, then children
    const idMap = new Map(); // frId → DB uuid

    const insertNode = async (node, parentDbId, index) => {
      const row = await Requirement.create({
        frId:        node.id,
        title:       node.title,
        description: node.description || null,
        weight:      node.weight ?? 0,
        progress:    node.progress ?? 0,
        parentId:    parentDbId || null,
        orderIndex:  index
      });
      idMap.set(node.id, row.id);

      const children = node.sub_requirements || [];
      for (let i = 0; i < children.length; i++) {
        await insertNode(children[i], row.id, i);
      }
    };

    for (let i = 0; i < requirements.length; i++) {
      await insertNode(requirements[i], null, i);
    }

    const flat = await Requirement.findAll();
    const tree = buildTree(flat);
    const overall = computeOverall(tree);

    return res.json({ success: true, data: tree, overall });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
