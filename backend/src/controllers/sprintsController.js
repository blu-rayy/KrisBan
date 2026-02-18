import { supabase } from '../config/database.js';

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

// @route   GET /api/sprints
// @desc    Get all sprints
// @access  Private
export const getSprints = async (req, res) => {
  try {
    console.log('Fetching sprints...');
    
    const { data: sprints, error } = await supabase
      .from('sprints')
      .select('*')
      .order('sprint_number', { ascending: true });

    if (error) {
      console.error('Supabase error fetching sprints:', error);
      throw error;
    }

    console.log('Retrieved sprints:', sprints?.length || 0);

    const formattedSprints = (sprints || []).map(sprint => ({
      id: String(sprint.id),
      sprintNumber: sprint.sprint_number,
      color: sprint.color,
      teamPlans: sprint.team_plans || [],
      createdBy: sprint.created_by,
      createdAt: sprint.created_at,
      updatedAt: sprint.updated_at
    }));

    res.status(200).json({
      success: true,
      data: formattedSprints
    });
  } catch (error) {
    console.error('Error in getSprints:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sprints'
    });
  }
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
    const { data: existingSprints } = await supabase
      .from('sprints')
      .select('*');

    const exists = (existingSprints || []).some(s => s.sprint_number === sprintNumber);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Sprint already exists'
      });
    }

    // Use provided color or generate a random one
    const usedColors = (existingSprints || []).map(s => s.color);
    const finalColor = color || getRandomColor(usedColors);

    // Create sprint
    const { data: sprint, error } = await supabase
      .from('sprints')
      .insert([{
        sprint_number: sprintNumber,
        color: finalColor,
        created_by: userId,
        team_plans: teamPlans || []
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating sprint:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Sprint created successfully',
      data: {
        id: String(sprint.id),
        sprintNumber: sprint.sprint_number,
        color: sprint.color,
        teamPlans: sprint.team_plans || [],
        createdBy: sprint.created_by,
        createdAt: sprint.created_at
      }
    });
  } catch (error) {
    console.error('Error in createSprint:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create sprint'
    });
  }
};

// @route   GET /api/sprints/:id
// @desc    Get a specific sprint
// @access  Private
export const getSprintById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: sprint, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: String(sprint.id),
        sprintNumber: sprint.sprint_number,
        color: sprint.color,
        teamPlans: sprint.team_plans || [],
        createdBy: sprint.created_by,
        createdAt: sprint.created_at,
        updatedAt: sprint.updated_at
      }
    });
  } catch (error) {
    console.error('Error in getSprintById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sprint'
    });
  }
};

// @route   PUT /api/sprints/:id
// @desc    Update a sprint
// @access  Private
export const updateSprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { sprintNumber, color } = req.body;

    const updateData = {};
    if (sprintNumber !== undefined) updateData.sprint_number = sprintNumber;
    if (color !== undefined) updateData.color = color;

    const { data: updatedSprint, error } = await supabase
      .from('sprints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedSprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sprint updated successfully',
      data: {
        id: String(updatedSprint.id),
        sprintNumber: updatedSprint.sprint_number,
        color: updatedSprint.color,
        teamPlans: updatedSprint.team_plans || [],
        createdBy: updatedSprint.created_by,
        createdAt: updatedSprint.created_at,
        updatedAt: updatedSprint.updated_at
      }
    });
  } catch (error) {
    console.error('Error in updateSprint:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update sprint'
    });
  }
};

// @route   DELETE /api/sprints/:id
// @desc    Delete a sprint
// @access  Private
export const deleteSprint = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Sprint deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteSprint:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete sprint'
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

    // Get the sprint first
    const { data: sprint, error: fetchError } = await supabase
      .from('sprints')
      .select('team_plans')
      .eq('id', id)
      .single();

    if (fetchError || !sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    // Add team plan to array
    const teamPlans = sprint.team_plans || [];
    if (!teamPlans.includes(teamPlan)) {
      teamPlans.push(teamPlan);
    }

    // Update sprint
    const { data: updatedSprint, error: updateError } = await supabase
      .from('sprints')
      .update({ team_plans: teamPlans })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: 'Team plan added successfully',
      data: {
        id: String(updatedSprint.id),
        sprintNumber: updatedSprint.sprint_number,
        teamPlans: updatedSprint.team_plans
      }
    });
  } catch (error) {
    console.error('Error in addTeamPlan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add team plan'
    });
  }
};

// @route   DELETE /api/sprints/:id/team-plans/:plan
// @desc    Remove a team plan from a sprint
// @access  Private
export const removeTeamPlan = async (req, res) => {
  try {
    const { id, plan } = req.params;

    // Get the sprint first
    const { data: sprint, error: fetchError } = await supabase
      .from('sprints')
      .select('team_plans')
      .eq('id', id)
      .single();

    if (fetchError || !sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    // Remove team plan from array
    const teamPlans = (sprint.team_plans || []).filter(p => p !== decodeURIComponent(plan));

    // Update sprint
    const { data: updatedSprint, error: updateError } = await supabase
      .from('sprints')
      .update({ team_plans: teamPlans })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: 'Team plan removed successfully',
      data: {
        id: String(updatedSprint.id),
        sprintNumber: updatedSprint.sprint_number,
        teamPlans: updatedSprint.team_plans
      }
    });
  } catch (error) {
    console.error('Error in removeTeamPlan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove team plan'
    });
  }
};
