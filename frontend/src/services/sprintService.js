import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const sprintService = {
  // Get all sprints
  getSprints: async () => {
    const response = await axios.get(`${API_URL}/sprints`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response;
  },

  // Get a specific sprint
  getSprintById: async (id) => {
    const response = await axios.get(`${API_URL}/sprints/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response;
  },

  // Create a new sprint
  createSprint: async (sprintData) => {
    const response = await axios.post(`${API_URL}/sprints`, sprintData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Update a sprint
  updateSprint: async (id, updateData) => {
    const response = await axios.put(`${API_URL}/sprints/${id}`, updateData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Delete a sprint
  deleteSprint: async (id) => {
    const response = await axios.delete(`${API_URL}/sprints/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response;
  },

  // Add a team plan to a sprint
  addTeamPlan: async (sprintId, teamPlan) => {
    const response = await axios.post(`${API_URL}/sprints/${sprintId}/team-plans`, { teamPlan }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Remove a team plan
  removeTeamPlan: async (teamPlanId) => {
    const response = await axios.delete(`${API_URL}/sprints/team-plans/${teamPlanId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response;
  },

  // Update a team plan
  updateTeamPlan: async (teamPlanId, teamPlan) => {
    const response = await axios.put(`${API_URL}/sprints/team-plans/${teamPlanId}`, { teamPlan }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Cleanup duplicate team plans for a sprint
  cleanupDuplicateTeamPlans: async (sprintId) => {
    const response = await axios.post(`${API_URL}/sprints/cleanup/duplicates`, { sprintId }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  }
};
