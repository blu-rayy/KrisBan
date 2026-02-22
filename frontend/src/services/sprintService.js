import api from './api';

export const sprintService = {
  // Get all sprints
  getSprints: async () => {
    const response = await api.get('/sprints');
    return response;
  },

  // Get a specific sprint
  getSprintById: async (id) => {
    const response = await api.get(`/sprints/${id}`);
    return response;
  },

  // Create a new sprint
  createSprint: async (sprintData) => {
    const response = await api.post('/sprints', sprintData);
    return response;
  },

  // Update a sprint
  updateSprint: async (id, updateData) => {
    const response = await api.put(`/sprints/${id}`, updateData);
    return response;
  },

  // Delete a sprint
  deleteSprint: async (id) => {
    const response = await api.delete(`/sprints/${id}`);
    return response;
  },

  // Add a team plan to a sprint
  addTeamPlan: async (sprintId, teamPlan) => {
    const response = await api.post(`/sprints/${sprintId}/team-plans`, { teamPlan });
    return response;
  },

  // Remove a team plan
  removeTeamPlan: async (teamPlanId) => {
    const response = await api.delete(`/sprints/team-plans/${teamPlanId}`);
    return response;
  },

  // Update a team plan
  updateTeamPlan: async (teamPlanId, teamPlan) => {
    const response = await api.put(`/sprints/team-plans/${teamPlanId}`, { teamPlan });
    return response;
  },

  // Cleanup duplicate team plans for a sprint
  cleanupDuplicateTeamPlans: async (sprintId) => {
    const response = await api.post('/sprints/cleanup/duplicates', { sprintId });
    return response;
  }
};
