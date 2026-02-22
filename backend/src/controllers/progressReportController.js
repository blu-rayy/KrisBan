import ProgressReport from '../models/ProgressReport.js';
import User from '../models/User.js';
import Sprint from '../models/Sprint.js';
import { supabase } from '../config/database.js';

const normalizeSupabaseErrorMessage = (error, fallbackMessage) => {
  const rawMessage = error?.message || '';
  const htmlLikeResponse = rawMessage.includes('<!DOCTYPE html>') || rawMessage.includes('<html');
  const gatewayError = /502|bad gateway|cloudflare/i.test(rawMessage);

  if (htmlLikeResponse || gatewayError) {
    return fallbackMessage;
  }

  return rawMessage || fallbackMessage;
};

const fetchUsersMapByIds = async (ids = []) => {
  const uniqueIds = [...new Set(ids.map((id) => String(id)).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, full_name, institute_email, personal_email')
    .in('id', uniqueIds);

  if (error) throw error;

  return new Map((users || []).map((user) => [
    String(user.id),
    {
      username: user.username,
      fullName: user.full_name,
      instituteEmail: user.institute_email,
      personalEmail: user.personal_email
    }
  ]));
};

// Helper function: Automatically create team plan if it doesn't exist
const ensureTeamPlanExists = async (sprintId, teamPlan, userId) => {
  if (!sprintId || !teamPlan || !teamPlan.trim()) {
    return;
  }

  try {
    // Check if this team plan already exists for this sprint
    const { data: existingPlan, error: existingError } = await supabase
      .from('sprint_team_plans')
      .select('id')
      .eq('sprint_id', sprintId)
      .eq('team_plan', teamPlan)
      .single();

    // If plan doesn't exist, create it
    if (!existingError && !existingPlan) {
      await supabase
        .from('sprint_team_plans')
        .insert([
          {
            sprint_id: sprintId,
            team_plan: teamPlan,
            created_by: userId
          }
        ]);
    }
  } catch (err) {
    // Silently fail - don't break the main operation if team plan creation fails
    console.log('Note: Could not ensure team plan exists:', err.message);
  }
};

// @route   POST /api/progress-reports
// @desc    Create a new progress report entry
// @access  Private
export const createProgressReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, memberId, sprintNo, teamPlan, category, taskDone, imageUrl } = req.body;

    // Validate required fields
    if (!date || !memberId || !sprintNo || !category || !taskDone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: date, memberId, sprintNo, category, taskDone'
      });
    }

    // Verify member exists
    const memberUser = await User.findById(memberId);
    if (!memberUser) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Look up sprint_id from sprint_number
    let sprintId = null;
    try {
      const { data: sprint, error: sprintError } = await supabase
        .from('sprints')
        .select('id')
        .eq('sprint_number', sprintNo)
        .single();
      
      if (!sprintError && sprint) {
        sprintId = sprint.id;
      }
    } catch (err) {
      // Sprint ID is optional, continue without it
    }

    // Create progress report
    const progressReport = await ProgressReport.create({
      date,
      member_id: memberId,
      sprint_no: sprintNo,
      sprint_id: sprintId,
      team_plan: teamPlan || '',
      category,
      task_done: taskDone,
      image_url: imageUrl,
      created_by: userId
    });

    // Automatically create team plan if it doesn't exist
    if (sprintId && teamPlan && teamPlan.trim()) {
      await ensureTeamPlanExists(sprintId, teamPlan, userId);
    }

    // Enrich with member details
    const member = await User.findById(memberId);
    const formattedReport = progressReport._formatReport();
    
    const enrichedReport = {
      id: String(formattedReport.id),
      date: formattedReport.date,
      memberId: String(formattedReport.memberId),
      sprintNo: formattedReport.sprintNo,
      sprintId: formattedReport.sprintId ? String(formattedReport.sprintId) : null,
      teamPlan: formattedReport.teamPlan,
      category: formattedReport.category,
      taskDone: formattedReport.taskDone,
      imageUrl: formattedReport.imageUrl,
      createdBy: String(formattedReport.createdBy),
      createdAt: formattedReport.createdAt,
      updatedAt: formattedReport.updatedAt,
      memberName: member?.username || 'Unknown',
      memberFullName: member?.fullName || 'Unknown',
      memberEmail: member?.instituteEmail || member?.personalEmail || 'Unknown'
    };

    res.status(201).json({
      success: true,
      message: 'Progress report created successfully',
      data: enrichedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/progress-reports
// @desc    Get all progress reports (with optional filters)
// @access  Private
export const getProgressReports = async (req, res) => {
  try {
    const { date, memberId, sprintNo, category } = req.query;

    console.log('Fetching progress reports with filters:', { date, memberId, sprintNo, category });

    // Use a simple query first, then enrich
    let query = supabase
      .from('progress_reports')
      .select('*');

    if (date) query = query.eq('date', date);
    if (memberId) query = query.eq('member_id', memberId);
    if (sprintNo) query = query.eq('sprint_no', sprintNo);
    if (category) query = query.eq('category', category);

    const { data: reports, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Retrieved reports from DB:', reports?.length || 0);

    let usersById = new Map();
    try {
      usersById = await fetchUsersMapByIds((reports || []).map((report) => report.member_id));
    } catch (memberFetchError) {
      console.warn('Could not fetch member profiles in batch:', normalizeSupabaseErrorMessage(memberFetchError, 'Member lookup temporarily unavailable'));
    }

    const enrichedReports = (reports || []).map((report) => {
      const member = usersById.get(String(report.member_id));

      return {
        id: String(report.id),
        date: report.date,
        memberId: String(report.member_id),
        memberName: report.memberName || member?.username || 'Unknown',
        memberFullName: report.memberFullName || member?.fullName || 'Unknown',
        memberEmail: report.memberEmail || member?.instituteEmail || member?.personalEmail || 'Unknown',
        sprintNo: report.sprint_no,
        sprintId: report.sprint_id ? String(report.sprint_id) : null,
        teamPlan: report.team_plan,
        category: report.category,
        taskDone: report.task_done,
        imageUrl: report.image_url,
        createdBy: String(report.created_by),
        createdAt: report.created_at,
        updatedAt: report.updated_at
      };
    });

    console.log('Returning enriched reports:', enrichedReports.length);

    res.status(200).json({
      success: true,
      data: enrichedReports
    });
  } catch (error) {
    console.error('Error in getProgressReports:', error);
    res.status(500).json({
      success: false,
      message: normalizeSupabaseErrorMessage(error, 'Failed to fetch progress reports')
    });
  }
};

// @route   GET /api/progress-reports/:id
// @desc    Get a single progress report by ID
// @access  Private
export const getProgressReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ProgressReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    // Enrich with member details
    const member = await User.findById(report.member_id);
    const formattedReport = report._formatReport();
    
    const enrichedReport = {
      id: String(formattedReport.id),
      date: formattedReport.date,
      memberId: String(formattedReport.memberId),
      sprintNo: formattedReport.sprintNo,
      sprintId: formattedReport.sprintId ? String(formattedReport.sprintId) : null,
      teamPlan: formattedReport.teamPlan,
      category: formattedReport.category,
      taskDone: formattedReport.taskDone,
      imageUrl: formattedReport.imageUrl,
      createdBy: String(formattedReport.createdBy),
      createdAt: formattedReport.createdAt,
      updatedAt: formattedReport.updatedAt,
      memberName: member?.username || 'Unknown',
      memberFullName: member?.fullName || 'Unknown',
      memberEmail: member?.instituteEmail || member?.personalEmail || 'Unknown'
    };

    res.status(200).json({
      success: true,
      data: enrichedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   PUT /api/progress-reports/:id
// @desc    Update a progress report entry
// @access  Private
export const updateProgressReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, memberId, sprintNo, teamPlan, category, taskDone, imageUrl } = req.body;

    // Check if report exists
    const report = await ProgressReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    // Only creator or admin can update
    if (report.created_by !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this report'
      });
    }

    // Verify member exists if memberId is provided
    if (memberId) {
      const memberUser = await User.findById(memberId);
      if (!memberUser) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }
    }

    const updateData = {};
    if (date) updateData.date = date;
    if (memberId) updateData.member_id = memberId;
    
    let newSprintId = null;
    if (sprintNo) {
      updateData.sprint_no = sprintNo;
      // Look up sprint_id from sprint_number
      const { data: sprint, error: sprintError } = await supabase
        .from('sprints')
        .select('id')
        .eq('sprint_number', sprintNo)
        .single();
      
      if (!sprintError && sprint) {
        updateData.sprint_id = sprint.id;
        newSprintId = sprint.id;
      } else {
        updateData.sprint_id = null;
      }
    }
    if (teamPlan !== undefined) updateData.team_plan = teamPlan;
    if (category) updateData.category = category;
    if (taskDone) updateData.task_done = taskDone;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;

    const updatedReport = await ProgressReport.updateOne(id, updateData);

    // Automatically create team plan if it doesn't exist (use new sprint_id if available, otherwise use existing)
    const sprintIdForTeamPlan = newSprintId || updatedReport.sprint_id;
    if (sprintIdForTeamPlan && teamPlan && teamPlan.trim()) {
      await ensureTeamPlanExists(sprintIdForTeamPlan, teamPlan, userId);
    }

    // Enrich with member details
    const member = await User.findById(updatedReport.member_id);
    const formattedReport = updatedReport._formatReport();
    
    const enrichedReport = {
      id: String(formattedReport.id),
      date: formattedReport.date,
      memberId: String(formattedReport.memberId),
      sprintNo: formattedReport.sprintNo,
      sprintId: formattedReport.sprintId ? String(formattedReport.sprintId) : null,
      teamPlan: formattedReport.teamPlan,
      category: formattedReport.category,
      taskDone: formattedReport.taskDone,
      imageUrl: formattedReport.imageUrl,
      createdBy: String(formattedReport.createdBy),
      createdAt: formattedReport.createdAt,
      updatedAt: formattedReport.updatedAt,
      memberName: member?.username || 'Unknown',
      memberFullName: member?.fullName || 'Unknown',
      memberEmail: member?.instituteEmail || member?.personalEmail || 'Unknown'
    };

    res.status(200).json({
      success: true,
      message: 'Progress report updated successfully',
      data: enrichedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   DELETE /api/progress-reports/:id
// @desc    Delete a progress report entry
// @access  Private
export const deleteProgressReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if report exists
    const report = await ProgressReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    // Only creator or admin can delete
    if (report.created_by !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this report'
      });
    }

    await ProgressReport.deleteOne(id);

    res.status(200).json({
      success: true,
      message: 'Progress report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/progress-reports/stats/summary
// @desc    Get progress report summary statistics
// @access  Private
export const getProgressReportSummary = async (req, res) => {
  try {
    const allReports = await ProgressReport.getAll('created_at', false);

    const summary = {
      totalReports: allReports.length,
      byCategory: {},
      bySprint: {},
      timestamp: new Date()
    };

    // Count by category
    allReports.forEach(report => {
      if (!summary.byCategory[report.category]) {
        summary.byCategory[report.category] = 0;
      }
      summary.byCategory[report.category]++;

      if (!summary.bySprint[report.sprint_no]) {
        summary.bySprint[report.sprint_no] = 0;
      }
      summary.bySprint[report.sprint_no]++;
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
