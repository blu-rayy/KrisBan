import { supabase } from '../config/database.js';

const TABLE_NAME = 'progress_reports';

class ProgressReport {
  constructor(data = {}) {
    this.id = data.id;
    this.date = data.date;
    this.member_id = data.member_id;
    this.sprint_no = data.sprint_no;
    this.team_plan = data.team_plan;
    this.category = data.category;
    this.task_done = data.task_done;
    this.image_url = data.image_url;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(data) {
    try {
      const { data: result, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            date: data.date,
            member_id: data.member_id,
            sprint_no: data.sprint_no,
            team_plan: data.team_plan,
            category: data.category,
            task_done: data.task_done,
            image_url: data.image_url || null,
            created_by: data.created_by,
          }
        ])
        .select('*')
        .single();

      if (error) throw error;
      return new ProgressReport(result);
    } catch (error) {
      throw new Error(`Failed to create progress report: ${error.message}`);
    }
  }

  static async find(filters = {}) {
    try {
      let query = supabase.from(TABLE_NAME).select('*');

      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      if (filters.member_id) {
        query = query.eq('member_id', filters.member_id);
      }
      if (filters.sprint_no) {
        query = query.eq('sprint_no', filters.sprint_no);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => new ProgressReport(item));
    } catch (error) {
      throw new Error(`Failed to fetch progress reports: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? new ProgressReport(data) : null;
    } catch (error) {
      throw new Error(`Failed to find progress report: ${error.message}`);
    }
  }

  static async updateOne(id, updateData) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return new ProgressReport(data);
    } catch (error) {
      throw new Error(`Failed to update progress report: ${error.message}`);
    }
  }

  static async deleteOne(id) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Failed to delete progress report: ${error.message}`);
    }
  }

  static async getAll(orderBy = 'created_at', ascending = false) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order(orderBy, { ascending });

      if (error) throw error;
      return data.map(item => new ProgressReport(item));
    } catch (error) {
      throw new Error(`Failed to fetch all progress reports: ${error.message}`);
    }
  }

  _formatReport() {
    return {
      id: this.id,
      date: this.date,
      memberId: this.member_id,
      sprintNo: this.sprint_no,
      teamPlan: this.team_plan,
      category: this.category,
      taskDone: this.task_done,
      imageUrl: this.image_url,
      createdBy: this.created_by,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }
}

export default ProgressReport;
