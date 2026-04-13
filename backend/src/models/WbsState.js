import { supabase } from '../config/database.js';

const TABLE_NAME = 'wbs_state';

class WbsState {
  static async findByUser(userId) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', String(userId))
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch WBS state: ${error.message}`);
    return data;
  }

  static async upsert(userId, { boards, teamMembers, activeBoardId }) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: String(userId),
          boards,
          team_members: teamMembers,
          active_board_id: activeBoardId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) throw new Error(`Failed to save WBS state: ${error.message}`);
    return data;
  }
}

export default WbsState;
