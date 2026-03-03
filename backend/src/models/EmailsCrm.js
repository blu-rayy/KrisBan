import { supabase } from '../config/database.js';

const SMES_TABLE = 'emails_crm_smes';
const TEMPLATES_TABLE = 'emails_crm_templates';

const formatSme = (row = {}) => ({
  id: String(row.id),
  name: row.name,
  title: row.title,
  organization: row.organization,
  pointPerson: row.point_person,
  status: row.status,
  lastContactDate: row.last_contact_date,
  notes: row.notes || '',
  createdBy: row.created_by ? String(row.created_by) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const formatTemplate = (row = {}) => ({
  id: String(row.id),
  templateName: row.template_name,
  content: row.content,
  createdBy: row.created_by ? String(row.created_by) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

class EmailsCrm {
  static async listSmes() {
    const { data, error } = await supabase
      .from(SMES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(formatSme);
  }

  static async createSme(payload, userId) {
    const { data, error } = await supabase
      .from(SMES_TABLE)
      .insert([
        {
          name: payload.name,
          title: payload.title,
          organization: payload.organization,
          point_person: payload.pointPerson,
          status: payload.status,
          last_contact_date: payload.lastContactDate || null,
          notes: payload.notes || '',
          created_by: userId
        }
      ])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return formatSme(data);
  }

  static async updateSme(id, payload) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.organization !== undefined) updateData.organization = payload.organization;
    if (payload.pointPerson !== undefined) updateData.point_person = payload.pointPerson;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.lastContactDate !== undefined) updateData.last_contact_date = payload.lastContactDate || null;
    if (payload.notes !== undefined) updateData.notes = payload.notes || '';

    const { data, error } = await supabase
      .from(SMES_TABLE)
      .update(updateData)
      .eq('id', String(id))
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return formatSme(data);
  }

  static async deleteSme(id) {
    const { error } = await supabase
      .from(SMES_TABLE)
      .delete()
      .eq('id', String(id));

    if (error) throw new Error(error.message);
  }

  static async listTemplates() {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(formatTemplate);
  }

  static async createTemplate(payload, userId) {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .insert([
        {
          template_name: payload.templateName,
          content: payload.content,
          created_by: userId
        }
      ])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return formatTemplate(data);
  }

  static async updateTemplate(id, payload) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (payload.templateName !== undefined) updateData.template_name = payload.templateName;
    if (payload.content !== undefined) updateData.content = payload.content;

    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .update(updateData)
      .eq('id', String(id))
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return formatTemplate(data);
  }

  static async deleteTemplate(id) {
    const { error } = await supabase
      .from(TEMPLATES_TABLE)
      .delete()
      .eq('id', String(id));

    if (error) throw new Error(error.message);
  }
}

export default EmailsCrm;
