import EmailsCrm from '../models/EmailsCrm.js';

const POINT_PEOPLE = ['Kristian', 'Marianne', 'Angel', 'Michael'];
const SME_STATUSES = ['Draft', 'Sent', 'Waiting', 'Responded', 'No Reply'];

const validateSmePayload = (payload, { partial = false } = {}) => {
  const requiredFields = ['name', 'title', 'organization', 'pointPerson', 'status'];

  if (!partial) {
    const missingField = requiredFields.find((field) => !String(payload?.[field] || '').trim());
    if (missingField) {
      return `${missingField} is required`;
    }
  }

  if (payload.pointPerson !== undefined && !POINT_PEOPLE.includes(payload.pointPerson)) {
    return 'Invalid pointPerson value';
  }

  if (payload.status !== undefined && !SME_STATUSES.includes(payload.status)) {
    return 'Invalid status value';
  }

  return null;
};

const validateTemplatePayload = (payload, { partial = false } = {}) => {
  if (!partial) {
    if (!String(payload?.templateName || '').trim()) {
      return 'templateName is required';
    }

    if (!String(payload?.content || '').trim()) {
      return 'content is required';
    }
  }

  return null;
};

export const getSmes = async (_req, res) => {
  try {
    const smes = await EmailsCrm.listSmes();
    res.status(200).json({ success: true, data: smes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch SMEs' });
  }
};

export const createSme = async (req, res) => {
  try {
    const validationError = validateSmePayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const sme = await EmailsCrm.createSme(req.body, req.user?.id || null);
    res.status(201).json({ success: true, message: 'SME created successfully', data: sme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create SME' });
  }
};

export const updateSme = async (req, res) => {
  try {
    const validationError = validateSmePayload(req.body, { partial: true });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const updated = await EmailsCrm.updateSme(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'SME updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update SME' });
  }
};

export const deleteSme = async (req, res) => {
  try {
    await EmailsCrm.deleteSme(req.params.id);
    res.status(200).json({ success: true, message: 'SME deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete SME' });
  }
};

export const getTemplates = async (_req, res) => {
  try {
    const templates = await EmailsCrm.listTemplates();
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch templates' });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const validationError = validateTemplatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const template = await EmailsCrm.createTemplate(req.body, req.user?.id || null);
    res.status(201).json({ success: true, message: 'Template created successfully', data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create template' });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const validationError = validateTemplatePayload(req.body, { partial: true });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const updated = await EmailsCrm.updateTemplate(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Template updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update template' });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await EmailsCrm.deleteTemplate(req.params.id);
    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete template' });
  }
};
