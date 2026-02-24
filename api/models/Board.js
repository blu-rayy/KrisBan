import { supabase } from '../config/database.js';

class Board {
  // Create a new board
  static async create(boardData) {
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            title: boardData.title,
            description: boardData.description || '',
            owner: boardData.owner,
            members: boardData.members || [],
            columns: boardData.columns || [],
            status: boardData.status || 'ACTIVE'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return this._formatBoard(data);
    } catch (error) {
      throw error;
    }
  }

  // Find boards with filters
  static async find(filter) {
    try {
      let query = supabase.from('boards').select('*');

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.$or) {
        // Handle OR conditions
        const orConditions = filter.$or;
        const conditions = orConditions.map((cond, idx) => {
          if (cond.owner) return `(owner.eq.${cond.owner})`;
          if (cond.members) return `(members.cs.["${cond.members}"])`;
          return '';
        }).filter(Boolean);

        // For now, fetch all active boards and filter in code
        query = query.eq('status', 'ACTIVE');
      }

      if (filter.owner) {
        query = query.eq('owner', filter.owner);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Post-process for OR conditions
      let boards = data.map(b => this._formatBoard(b));

      if (filter.$or) {
        boards = boards.filter(board => {
          return filter.$or.some(cond => {
            if (cond.owner && board.owner === cond.owner) return true;
            if (cond.members && board.members.includes(cond.members)) return true;
            return false;
          });
        });
      }

      return boards;
    } catch (error) {
      throw error;
    }
  }

  // Find board by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', String(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this._formatBoard(data);
    } catch (error) {
      throw error;
    }
  }

  // Update board
  static async updateOne(filter, updateData) {
    try {
      let query = supabase.from('boards').update({
        title: updateData.title,
        description: updateData.description,
        members: updateData.members,
        columns: updateData.columns,
        status: updateData.status
      });

      if (filter.id) {
        query = query.eq('id', filter.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return this._formatBoard(data);
    } catch (error) {
      throw error;
    }
  }

  // Delete boards
  static async deleteMany(filter = {}) {
    try {
      let query = supabase.from('boards').delete();

      if (Object.keys(filter).length === 0) {
        // Delete all
        const { error } = await query.neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Format board data
  static _formatBoard(data) {
    return {
      _id: String(data.id),
      id: String(data.id),
      title: data.title,
      description: data.description,
      owner: String(data.owner),
      members: (data.members || []).map(m => String(m)),
      columns: data.columns || [],
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export default Board;

