import { supabase } from '../config/database.js';

const SMES_TABLE = 'emails_crm_smes';
const TEMPLATES_TABLE = 'emails_crm_templates';
const LOGS_TABLE = 'emails_crm_sme_logs';

const formatPointPerson = (userRow = {}) => ({
  id: String(userRow.id),
  username: userRow.username || '',
  profilePicture: userRow.profile_picture || null
});

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getPrimaryNameToken = (value) => normalizeText(value).split(/\s+/).filter(Boolean)[0] || '';

const findUserBySnapshot = (users = [], snapshotValue = '') => {
  const normalizedSnapshot = normalizeText(snapshotValue);
  if (!normalizedSnapshot) return null;

  const snapshotToken = getPrimaryNameToken(snapshotValue);

  const exactMatch = users.find((user) => normalizeText(user.username) === normalizedSnapshot);

  if (exactMatch) return exactMatch;

  return users.find((user) => {
    const usernameToken = getPrimaryNameToken(user.username);
    return usernameToken === snapshotToken;
  }) || null;
};

const enrichSmeRows = async (rows = []) => {
  if (!rows.length) {
    return rows;
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, profile_picture');

  if (error) throw new Error(error.message);

  const usersById = new Map((users || []).map((user) => [String(user.id), user]));

  return rows.map((row) => ({
    ...row,
    point_person_user: (() => {
      if (row.point_person_user_id) {
        return usersById.get(String(row.point_person_user_id)) || null;
      }

      return findUserBySnapshot(users || [], row.point_person_name_snapshot);
    })()
  }));
};

const formatSme = (row = {}) => ({
  id: String(row.id),
  name: row.name,
  title: row.title,
  organization: row.organization,
  pointPersonUserId: row.point_person_user_id ? String(row.point_person_user_id) : null,
  pointPersonNameSnapshot: row.point_person_name_snapshot,
  pointPerson: row.point_person_user?.username || row.point_person_name_snapshot || '',
  pointPersonProfilePicture: row.point_person_user?.profile_picture || null,
  status: row.status,
  lastContactDate: row.last_contact_date,
  notes: row.notes || '',
  profilePicture: row.profile_picture || null,
  summary: row.summary || '',
  email: row.email || '',
  phone: row.phone || '',
  linkedinUrl: row.linkedin_url || '',
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

const formatSmeLog = (row = {}) => {
  // Prefer explicit messages array; fall back to legacy sent_message/response for old rows
  let messages;
  if (Array.isArray(row.messages) && row.messages.length > 0) {
    messages = row.messages;
  } else {
    messages = [
      ...(row.sent_message ? [{ direction: 'sent', content: row.sent_message }] : []),
      ...(row.response ? [{ direction: 'received', content: row.response }] : [])
    ];
  }

  return {
    id: String(row.id),
    smeId: String(row.sme_id),
    logDate: row.log_date || null,
    messages,
    templateId: row.template_id ? String(row.template_id) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

class EmailsCrm {
  static async listSmes() {
    const { data, error } = await supabase
      .from(SMES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    const enrichedRows = await enrichSmeRows(data || []);
    return enrichedRows.map(formatSme);
  }

  static async listPointPeople() {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, profile_picture')
      .eq('is_active', true)
      .order('username', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(formatPointPerson);
  }

  static async getPointPersonById(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id, username, profile_picture')
      .eq('id', String(userId))
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data || null;
  }

  static async getPointPersonByName(name) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return null;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, profile_picture');

    if (error) throw new Error(error.message);
    return findUserBySnapshot(users || [], normalizedName);
  }

  static async getSmeById(id) {
    const { data, error } = await supabase
      .from(SMES_TABLE)
      .select('*')
      .eq('id', String(id))
      .single();

    if (error) throw new Error(error.message);

    const enrichedRows = await enrichSmeRows([data]);
    return formatSme(enrichedRows[0]);
  }

  static async createSme(payload, userId) {
    let pointPersonUserId = payload.pointPersonUserId || null;
    let pointPersonNameSnapshot = String(payload.pointPersonNameSnapshot || payload.pointPerson || '').trim();

    if (pointPersonUserId) {
      const pointPersonUser = await this.getPointPersonById(pointPersonUserId);
      if (!pointPersonUser) {
        throw new Error('Selected point person user was not found');
      }

      pointPersonUserId = String(pointPersonUser.id);
      pointPersonNameSnapshot = pointPersonUser.username || pointPersonNameSnapshot;
    } else if (pointPersonNameSnapshot) {
      const pointPersonUser = await this.getPointPersonByName(pointPersonNameSnapshot);
      if (pointPersonUser) {
        pointPersonUserId = String(pointPersonUser.id);
        pointPersonNameSnapshot = pointPersonUser.username || pointPersonNameSnapshot;
      }
    }

    const { data, error } = await supabase
      .from(SMES_TABLE)
      .insert([
        {
          name: payload.name,
          title: payload.title,
          organization: payload.organization,
          point_person_user_id: pointPersonUserId,
          point_person_name_snapshot: pointPersonNameSnapshot,
          status: payload.status,
          last_contact_date: payload.lastContactDate || null,
          notes: payload.notes || '',
          profile_picture: payload.profilePicture || null,
          summary: payload.summary || null,
          email: payload.email || null,
          phone: payload.phone || null,
          linkedin_url: payload.linkedinUrl || null,
          created_by: userId
        }
      ])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.getSmeById(data.id);
  }

  static async updateSme(id, payload) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.organization !== undefined) updateData.organization = payload.organization;
    if (payload.pointPersonUserId !== undefined) {
      if (payload.pointPersonUserId) {
        const pointPersonUser = await this.getPointPersonById(payload.pointPersonUserId);
        if (!pointPersonUser) {
          throw new Error('Selected point person user was not found');
        }
        updateData.point_person_user_id = String(pointPersonUser.id);

        if (payload.pointPersonNameSnapshot !== undefined) {
          updateData.point_person_name_snapshot = String(payload.pointPersonNameSnapshot || '').trim() || pointPersonUser.username;
        } else {
          updateData.point_person_name_snapshot = pointPersonUser.username;
        }
      } else {
        updateData.point_person_user_id = null;
      }
    }

    if (payload.pointPersonNameSnapshot !== undefined && updateData.point_person_name_snapshot === undefined) {
      updateData.point_person_name_snapshot = String(payload.pointPersonNameSnapshot || payload.pointPerson || '').trim();
    }

    if (payload.pointPerson !== undefined && updateData.point_person_name_snapshot === undefined) {
      updateData.point_person_name_snapshot = String(payload.pointPerson || '').trim();
    }

    if (
      !updateData.point_person_user_id &&
      updateData.point_person_name_snapshot
    ) {
      const pointPersonUser = await this.getPointPersonByName(updateData.point_person_name_snapshot);
      if (pointPersonUser) {
        updateData.point_person_user_id = String(pointPersonUser.id);
        updateData.point_person_name_snapshot = pointPersonUser.username || updateData.point_person_name_snapshot;
      }
    }

    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.lastContactDate !== undefined) updateData.last_contact_date = payload.lastContactDate || null;
    if (payload.notes !== undefined) updateData.notes = payload.notes || '';
    if (payload.profilePicture !== undefined) updateData.profile_picture = payload.profilePicture || null;
    if (payload.summary !== undefined) updateData.summary = payload.summary || null;
    if (payload.email !== undefined) updateData.email = payload.email || null;
    if (payload.phone !== undefined) updateData.phone = payload.phone || null;
    if (payload.linkedinUrl !== undefined) updateData.linkedin_url = payload.linkedinUrl || null;

    const { data, error } = await supabase
      .from(SMES_TABLE)
      .update(updateData)
      .eq('id', String(id))
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.getSmeById(data.id);
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

  // --- Conversation Logs ---

  static async listSmeLogsBySmeId(smeId) {
    const { data, error } = await supabase
      .from(LOGS_TABLE)
      .select('*')
      .eq('sme_id', String(smeId))
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(formatSmeLog);
  }

  static async createSmeLog(smeId, payload, userId) {
    const messages = Array.isArray(payload.messages) && payload.messages.length > 0
      ? payload.messages.map((m) => ({ direction: m.direction, content: m.content }))
      : null;

    const { data, error } = await supabase
      .from(LOGS_TABLE)
      .insert([
        {
          sme_id: String(smeId),
          log_date: payload.logDate || null,
          messages,
          template_id: payload.templateId || null,
          created_by: userId || null
        }
      ])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return formatSmeLog(data);
  }

  static async updateSmeLog(id, payload) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (payload.logDate !== undefined) updateData.log_date = payload.logDate || null;
    if (payload.messages !== undefined) {
      updateData.messages = Array.isArray(payload.messages) && payload.messages.length > 0
        ? payload.messages.map((m) => ({ direction: m.direction, content: m.content }))
        : null;
    }
    if (payload.templateId !== undefined) updateData.template_id = payload.templateId || null;

    const { data, error } = await supabase
      .from(LOGS_TABLE)
      .update(updateData)
      .eq('id', String(id))
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return formatSmeLog(data);
  }

  static async deleteSmeLog(id) {
    const { error } = await supabase
      .from(LOGS_TABLE)
      .delete()
      .eq('id', String(id));

    if (error) throw new Error(error.message);
  }
}

export default EmailsCrm;
