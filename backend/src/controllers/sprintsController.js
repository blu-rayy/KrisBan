import Sprint from '../models/Sprint.js';
import User from '../models/User.js';

// Color palette for sprints (muted/pastel versions)
const SPRINT_COLORS = [
  '#BFDBFE', // Light Blue
  '#DDD6FE', // Light Purple
  '#FBCFE8', // Light Pink
  '#FCD34D', // Light Amber
  '#A7F3D0', // Light Emerald
  '#A5F3FC', // Light Cyan
  '#FECACA', // Light Red
  '#FED7AA', // Light Orange
  '#C7D2FE', // Light Indigo
  '#99F6E4'  // Light Teal
];

// Generate a random color that hasn't been used recently
const getRandomColor = (usedColors = []) => {
  const availableColors = SPRINT_COLORS.filter(color => !usedColors.includes(color));
  if (availableColors.length === 0) {
    return SPRINT_COLORS[Math.floor(Math.random() * SPRINT_COLORS.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

// @route   POST /api/sprints
// @desc    Create a new sprint
// @access  Private
export const createSprint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sprintNumber, color, teamPlans = [] } = req.body;

    // Validate required fields
    if (!sprintNumber) {
      return res.status(400).json({
        success: false,
        message: 'Sprint number is required'
      });
    }

    // Check if sprint already exists
    const existingSprints = await Sprint.find();
    const exists = existingSprints.some(s => s.sprint_number === sprintNumber);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Sprint already exists'
      });
    }

    // Use provided color or generate a random one
    const usedColors = existingSprints.map(s => s.color);
    const finalColor = color || getRandomColor(usedColors);

    // Create sprint
    const sprint = await Sprint.create({
      sprint_number: sprintNumber,
      color: finalColor,
      created_by: userId
    });

    // Add team plans if provided
    let formattedSprint = sprint._formatSprint();
    if (teamPlans && teamPlans.length > 0) {
      const addedPlans = await Promise.all(
        teamPlans.map(plan => Sprint.addTeamPlan(sprint.id, plan, userId))
      );
      formattedSprint.teamPlans = addedPlans;
    }

    res.status(201).json({
      success: true,
      message: 'Sprint created successfully',
      data: formattedSprint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/sprints
// @desc    Get all sprints
// @access  Private
export const getSprints = async (req, res) => {
  try {
    const sprints = await Sprint.find();

    const formattedSprints = sprints.map(sprint => sprint._formatSprint());

    res.status(200).json({
      success: true,
      data: formattedSprints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/sprints/:id
// @desc    Get a specific sprint
// @access  Private
export const getSprintById = async (req, res) => {
  try {
    const { id } = req.params;

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sprint._formatSprint()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   PUT /api/sprints/:id
// @desc    Update a sprint
// @access  Private
export const updateSprint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { sprintNumber, color } = req.body;

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    const updateData = {};
    if (sprintNumber) updateData.sprint_number = sprintNumber;
    if (color) updateData.color = color;

    const updatedSprint = await Sprint.updateOne(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Sprint updated successfully',
      data: updatedSprint._formatSprint()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   DELETE /api/sprints/:id
// @desc    Delete a sprint
// @access  Private
export const deleteSprint = async (req, res) => {
  try {
    const { id } = req.params;

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    await Sprint.deleteOne(id);

    res.status(200).json({
      success: true,
      message: 'Sprint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   POST /api/sprints/:id/team-plans
// @desc    Add a team plan to a sprint
// @access  Private
export const addTeamPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { teamPlan } = req.body;

    if (!teamPlan) {
      return res.status(400).json({
        success: false,
        message: 'Team plan is required'
      });
    }

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    const newTeamPlan = await Sprint.addTeamPlan(id, teamPlan, userId);

    res.status(201).json({
      success: true,
      message: 'Team plan added successfully',
      data: newTeamPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   PUT /api/sprints/team-plans/:teamPlanId
// @desc    Update a team plan
// @access  Private
export const updateTeamPlan = async (req, res) => {
  try {
    const { teamPlanId } = req.params;
    const { teamPlan } = req.body;

    if (!teamPlan) {
      return res.status(400).json({
        success: false,
        message: 'Team plan is required'
      });
    }

    const updated = await Sprint.updateTeamPlan(teamPlanId, teamPlan);

    res.status(200).json({
      success: true,
      message: 'Team plan updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   DELETE /api/sprints/team-plans/:teamPlanId
// @desc    Remove a team plan from a sprint
// @access  Private
export const removeTeamPlan = async (req, res) => {
  try {
    const { teamPlanId } = req.params;

    const removed = await Sprint.removeTeamPlan(teamPlanId);

    res.status(200).json({
      success: true,
      message: 'Team plan removed successfully',
      data: removed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
