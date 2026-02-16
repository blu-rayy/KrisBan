import { supabase } from '../config/database.js';

const TABLE_NAME = 'sprints';
const TEAM_PLANS_TABLE = 'sprint_team_plans';

class Sprint {
  constructor(data = {}) {
    this.id = data.id ? String(data.id) : null;
    this.sprint_number = data.sprint_number;
    this.color = data.color;
    this.created_by = data.created_by ? String(data.created_by) : null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.team_plans = data.team_plans || [];
  }

  static async create(data) {
    try {
      const { data: result, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            sprint_number: data.sprint_number,
            color: data.color,
            created_by: data.created_by,
          }
        ])
        .select('*')
        .single();

      if (error) throw error;
      return new Sprint(result);
    } catch (error) {
      throw new Error(`Failed to create sprint: ${error.message}`);
    }
  }

  static async find(filters = {}) {
    try {
      let query = supabase.from(TABLE_NAME).select('*');

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch team plans for each sprint
      const sprintsWithPlans = await Promise.all(
        data.map(async (sprint) => {
          const teamPlans = await this.getTeamPlans(sprint.id);
          return new Sprint({ ...sprint, team_plans: teamPlans });
        })
      );

      return sprintsWithPlans;
    } catch (error) {
      throw new Error(`Failed to fetch sprints: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', String(id))
        .single();

      if (error) throw error;
      
      if (data) {
        const teamPlans = await this.getTeamPlans(data.id);
        return new Sprint({ ...data, team_plans: teamPlans });
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to find sprint: ${error.message}`);
    }
  }

  static async updateOne(id, updateData) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', String(id))
        .select('*')
        .single();

      if (error) throw error;
      
      const teamPlans = await this.getTeamPlans(data.id);
      return new Sprint({ ...data, team_plans: teamPlans });
    } catch (error) {
      throw new Error(`Failed to update sprint: ${error.message}`);
    }
  }

  static async deleteOne(id) {
    try {
      // First delete all team plans associated with this sprint
      await supabase
        .from(TEAM_PLANS_TABLE)
        .delete()
        .eq('sprint_id', String(id));

      // Then delete the sprint
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', String(id))
        .select('*')
        .single();

      if (error) throw error;
      return new Sprint(data);
    } catch (error) {
      throw new Error(`Failed to delete sprint: ${error.message}`);
    }
  }

  // Team Plan methods
  static async getTeamPlans(sprintId) {
    try {
      const { data, error } = await supabase
        .from(TEAM_PLANS_TABLE)
        .select('*')
        .eq('sprint_id', String(sprintId))
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch team plans: ${error.message}`);
    }
  }

  static async addTeamPlan(sprintId, teamPlan, userId) {
    try {
      const { data, error } = await supabase
        .from(TEAM_PLANS_TABLE)
        .insert([
          {
            sprint_id: String(sprintId),
            team_plan: teamPlan,
            created_by: String(userId),
          }
        ])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add team plan: ${error.message}`);
    }
  }

  static async removeTeamPlan(teamPlanId) {
    try {
      const { data, error } = await supabase
        .from(TEAM_PLANS_TABLE)
        .delete()
        .eq('id', String(teamPlanId))
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to remove team plan: ${error.message}`);
    }
  }

  _formatSprint() {
    return {
      id: this.id,
      sprintNumber: this.sprint_number,
      color: this.color,
      createdBy: this.created_by,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      teamPlans: this.team_plans || []
    };
  }
}

export default Sprint;
