import ProgressReport from '../models/ProgressReport.js';
import User from '../models/User.js';

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

    // Create progress report
    const progressReport = await ProgressReport.create({
      date,
      member_id: memberId,
      sprint_no: sprintNo,
      team_plan: teamPlan || '',
      category,
      task_done: taskDone,
      image_url: imageUrl,
      created_by: userId
    });

    // Enrich with member details
    const member = await User.findById(memberId);
    const formattedReport = progressReport._formatReport();
    
    const enrichedReport = {
      id: String(formattedReport.id),
      date: formattedReport.date,
      memberId: String(formattedReport.memberId),
      sprintNo: formattedReport.sprintNo,
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

    const filters = {};
    if (date) filters.date = date;
    if (memberId) filters.member_id = memberId;
    if (sprintNo) filters.sprint_no = sprintNo;
    if (category) filters.category = category;

    const reports = await ProgressReport.find(filters);

    // Enrich with member details
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const member = await User.findById(report.member_id);
        const formattedReport = report._formatReport();
        
        return {
          id: String(formattedReport.id),
          date: formattedReport.date,
          memberId: String(formattedReport.memberId),
          sprintNo: formattedReport.sprintNo,
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
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedReports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
    if (sprintNo) updateData.sprint_no = sprintNo;
    if (teamPlan !== undefined) updateData.team_plan = teamPlan;
    if (category) updateData.category = category;
    if (taskDone) updateData.task_done = taskDone;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;

    const updatedReport = await ProgressReport.updateOne(id, updateData);

    // Enrich with member details
    const member = await User.findById(updatedReport.member_id);
    const formattedReport = updatedReport._formatReport();
    
    const enrichedReport = {
      id: String(formattedReport.id),
      date: formattedReport.date,
      memberId: String(formattedReport.memberId),
      sprintNo: formattedReport.sprintNo,
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
