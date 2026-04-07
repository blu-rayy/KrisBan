import { supabase } from '../config/database.js';

class Requirement {
  static async findAll() {
    const { data, error } = await supabase
      .from('functional_requirements')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('functional_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async create(fields) {
    const { data, error } = await supabase
      .from('functional_requirements')
      .insert([{
        fr_id:       fields.frId,
        title:       fields.title,
        description: fields.description || null,
        weight:      fields.weight ?? 0,
        progress:    fields.progress ?? 0,
        parent_id:   fields.parentId || null,
        order_index: fields.orderIndex ?? 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const update = {};
    if (fields.frId       !== undefined) update.fr_id       = fields.frId;
    if (fields.title      !== undefined) update.title       = fields.title;
    if (fields.description !== undefined) update.description = fields.description;
    if (fields.weight     !== undefined) update.weight      = fields.weight;
    if (fields.progress   !== undefined) update.progress    = fields.progress;
    if (fields.orderIndex !== undefined) update.order_index = fields.orderIndex;

    const { data, error } = await supabase
      .from('functional_requirements')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('functional_requirements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async deleteAll() {
    const { error } = await supabase
      .from('functional_requirements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
    return true;
  }
}

export default Requirement;
