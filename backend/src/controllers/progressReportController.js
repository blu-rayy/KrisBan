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
    .select('id, username, full_name, institute_email, personal_email, profile_picture')
    .in('id', uniqueIds);

  if (error) throw error;

  return new Map((users || []).map((user) => [
    String(user.id),
    {
      username: user.username,
      fullName: user.full_name,
      instituteEmail: user.institute_email,
      personalEmail: user.personal_email,
      profilePicture: user.profile_picture
    }
  ]));
};

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLastCompletedMondayToSaturdayRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysBackToSaturday = (today.getDay() + 1) % 7;
  if (daysBackToSaturday === 0) {
    daysBackToSaturday = 7;
  }

  const endSaturday = new Date(today);
  endSaturday.setDate(today.getDate() - daysBackToSaturday);

  const startMonday = new Date(endSaturday);
  startMonday.setDate(endSaturday.getDate() - 5);

  return {
    startMonday,
    endSaturday,
    startDate: formatDateOnly(startMonday),
    endDate: formatDateOnly(endSaturday)
  };
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
    const { date, memberId, sprintNo, category, limit, sortBy, sortOrder, includeImages, page, pageSize } = req.query;

    const shouldIncludeImages = String(includeImages ?? 'true').toLowerCase() !== 'false';
    const baseColumns = [
      'id',
      'date',
      'member_id',
      'sprint_no',
      'sprint_id',
      'team_plan',
      'category',
      'task_done',
      'created_by',
      'created_at',
      'updated_at'
    ];

    if (shouldIncludeImages) {
      baseColumns.push('image_url');
    }

    // Use a simple query first, then enrich
    let query = supabase
      .from('progress_reports')
      .select(baseColumns.join(','));

    if (date) query = query.eq('date', date);
    if (memberId) query = query.eq('member_id', memberId);
    if (sprintNo) query = query.eq('sprint_no', sprintNo);
    if (category) query = query.eq('category', category);

    const allowedSortFields = new Set(['created_at', 'date', 'updated_at']);
    const orderField = allowedSortFields.has(String(sortBy)) ? String(sortBy) : 'created_at';
    const ascending = String(sortOrder || 'desc').toLowerCase() === 'asc';

    query = query.order(orderField, { ascending });

    const parsedLimit = Number.parseInt(limit, 10);
    const parsedPage = Number.parseInt(page, 10);
    const parsedPageSize = Number.parseInt(pageSize, 10);

    let paginationMeta = null;
    if (!Number.isNaN(parsedPage) && parsedPage > 0 && !Number.isNaN(parsedPageSize) && parsedPageSize > 0) {
      const from = (parsedPage - 1) * parsedPageSize;
      const to = from + parsedPageSize - 1;
      query = query.range(from, to);
      paginationMeta = {
        page: parsedPage,
        pageSize: parsedPageSize
      };
    }

    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      query = query.limit(parsedLimit);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

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
        memberProfilePicture: report.memberProfilePicture || member?.profilePicture || null,
        sprintNo: report.sprint_no,
        sprintId: report.sprint_id ? String(report.sprint_id) : null,
        teamPlan: report.team_plan,
        category: report.category,
        taskDone: report.task_done,
        imageUrl: shouldIncludeImages ? report.image_url : undefined,
        createdBy: String(report.created_by),
        createdAt: report.created_at,
        updatedAt: report.updated_at
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedReports,
      ...(paginationMeta ? { pagination: paginationMeta } : {})
    });
  } catch (error) {
    console.error('Error in getProgressReports:', error);
    res.status(500).json({
      success: false,
      message: normalizeSupabaseErrorMessage(error, 'Failed to fetch progress reports')
    });
  }
};

// @route   GET /api/progress-reports/stats/last-week
// @desc    Get last completed Monday-Saturday progress counts
// @access  Private
export const getLastWeekProgressStats = async (req, res) => {
  try {
    const { startMonday, endSaturday, startDate, endDate } = getLastCompletedMondayToSaturdayRange();

    const { data: reports, error } = await supabase
      .from('progress_reports')
      .select('date')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const countsByDate = (reports || []).reduce((acc, report) => {
      const key = String(report.date);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S'];
    const days = dayLabels.map((label, index) => {
      const currentDate = new Date(startMonday);
      currentDate.setDate(startMonday.getDate() + index);
      const dateKey = formatDateOnly(currentDate);
      return {
        day: label,
        date: dateKey,
        count: countsByDate[dateKey] || 0,
        hasProgress: (countsByDate[dateKey] || 0) > 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        totalEntries: (reports || []).length,
        days
      }
    });
  } catch (error) {
    console.error('Error in getLastWeekProgressStats:', error);
    res.status(500).json({
      success: false,
      message: normalizeSupabaseErrorMessage(error, 'Failed to fetch last week progress stats')
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

// Helper function to extract categories from task descriptions
const extractCategories = (tasks) => {
  if (!tasks || tasks.length === 0) return [];
  
  const categoryKeywords = {
    'Branding': ['logo', 'brand', 'color', 'design', 'visual', 'theme', 'layout', 'font'],
    'Implementation': ['implement', 'code', 'develop', 'build', 'create', 'function', 'feature', 'developed'],
    'Documentation': ['document', 'write', 'documentation', 'readme', 'guide', 'documented'],
    'Revision': ['revise', 'proofread', 'edit', 'update', 'revised', 'chapter', 'section'],
    'Testing': ['test', 'qa', 'quality', 'debug', 'fix', 'tested'],
    'Research': ['research', 'study', 'analyze', 'investigate', 'explore', 'investigated']
  };

  const foundCategories = new Set();
  
  tasks.forEach(taskDesc => {
    if (!taskDesc) return;
    const lowerDesc = String(taskDesc).toLowerCase();
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        foundCategories.add(category);
      }
    });
  });

  return Array.from(foundCategories);
};

// Helper function to generate natural language summary without server-side NLP
const generateNaturalSummary = (taskDescriptions, teamPlans) => {
  const cleanedPlans = (teamPlans || []).map((item) => String(item).trim()).filter(Boolean);
  const cleanedTasks = (taskDescriptions || []).map((item) => String(item).trim()).filter(Boolean);

  if (cleanedPlans.length === 0 && cleanedTasks.length === 0) {
    return 'Team progress report.';
  }

  if (cleanedPlans.length > 0) {
    return `The team ${cleanedPlans.slice(0, 2).join(' and ')}.`;
  }

  return `The team worked on ${cleanedTasks.slice(0, 3).join(' and ')}.`;
};

// Helper function to create member name from full name
const getMemberDisplayName = (fullName, username) => {
  if (!fullName && !username) return 'UNKNOWN';
  
  const name = fullName || username;
  const firstName = String(name).split(' ')[0].toUpperCase();
  
  // Map common names to required format
  const nameMap = {
    'KRISTIAN': 'KRISTIAN',
    'ANGEL': 'ANGEL',
    'MICHAEL': 'MICHAEL',
    'MARIANNE': 'MARIANNE',
    'KRIS': 'KRISTIAN',
    'KRISTIAN': 'KRISTIAN'
  };
  
  return nameMap[firstName] || firstName;
};

// Helper to generate one-sentence summary per member
const generateMemberSummary = (memberName, tasks, teamPlans) => {
  if (!tasks || tasks.length === 0) {
    return `No task recorded for this date.`;
  }
  
  // Combine tasks into a single sentence
  const taskSummary = tasks.slice(0, 3).join(' and ');
  return taskSummary.charAt(0).toUpperCase() + taskSummary.slice(1) + (taskSummary.endsWith('.') ? '' : '.');
};

// Helper to create team-wide summary sentence
const generateTeamSummary = (allTasks, allPlans) => {
  const tasks = [...new Set([...allTasks, ...allPlans])].filter(Boolean);
  if (tasks.length === 0) return 'No team activity recorded.';
  
  // Extract key actions (verbs) from tasks
  const actionKeywords = {
    'Coded': ['coded', 'code', 'implemented', 'developed', 'created'],
    'Refined': ['refined', 'improved', 'enhanced', 'optimized'],
    'Added': ['added', 'created', 'included', 'introduced'],
    'Revised': ['revised', 'edited', 'updated', 'proofread'],
    'Analyzed': ['analyzed', 'examined', 'studied', 'investigated'],
    'Designed': ['designed', 'created', 'planned', 'architected']
  };
  
  const foundActions = new Set();
  tasks.forEach(task => {
    const lower = String(task).toLowerCase();
    Object.entries(actionKeywords).forEach(([action, keywords]) => {
      if (keywords.some(kw => lower.includes(kw))) {
        foundActions.add(action);
      }
    });
  });
  
  const actions = Array.from(foundActions).slice(0, 3);
  if (actions.length === 0) {
    return `The team accomplished multiple tasks and objectives.`;
  }
  
  return `The team ${actions.join(', ')} various components and requirements.`;
};

// @route   GET /api/progress-reports/daily-report
// @desc    Generate formatted daily accomplishment report
// @access  Private
export const generateDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (YYYY-MM-DD format)'
      });
    }

    // Fetch reports for the specific date
    const { data: reports, error } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!reports || reports.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          date,
          report: `DATE: ${date}\n* No progress reports recorded for this date.\n\nKRISTIAN:\nANGEL:\nMICHAEL:\nMARIANNE:`,
          message: 'No data for this date'
        }
      });
    }

    // Fetch user data
    const userIds = [...new Set(reports.map(r => r.member_id).filter(Boolean))];
    const usersMap = await fetchUsersMapByIds(userIds);

    // Group reports by member
    const memberReports = {};
    const allTasks = [];
    const allPlans = [];

    reports.forEach(report => {
      const userId = String(report.member_id);
      if (!memberReports[userId]) {
        memberReports[userId] = [];
      }
      memberReports[userId].push(report);

      if (report.task_done && report.task_done.trim()) {
        allTasks.push(report.task_done);
      }
      if (report.team_plan && report.team_plan.trim()) {
        allPlans.push(report.team_plan);
      }
    });

    // Required members in specific order
    const requiredMembers = [
      { id: 'KRISTIAN', name: 'KRISTIAN' },
      { id: 'ANGEL', name: 'ANGEL' },
      { id: 'MICHAEL', name: 'MICHAEL' },
      { id: 'MARIANNE', name: 'MARIANNE' }
    ];

    // Generate team summary
    const teamSummary = generateTeamSummary(allTasks, allPlans);

    // Format date nicely
    const dateObj = new Date(date);
    const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
    const dayNum = dateObj.getDate();
    const formattedDate = `${monthName} ${dayNum}, ${dateObj.getFullYear()}`;

    // Build the report
    let reportText = `DATE: ${formattedDate}\n* ${teamSummary}\n\n`;

    // Add each member's summary
    requiredMembers.forEach(member => {
      // Try to find user by matching first name
      let memberTasks = [];
      let foundUser = false;

      Object.entries(memberReports).forEach(([userId, reports]) => {
        const user = usersMap.get(userId);
        if (user) {
          const firstName = String(user.fullName || user.username || '').split(' ')[0].toUpperCase();
          if (firstName === member.name || member.name.includes(firstName)) {
            foundUser = true;
            reports.forEach(report => {
              if (report.task_done && report.task_done.trim()) {
                memberTasks.push(report.task_done);
              }
            });
          }
        }
      });

      const memberSummary = generateMemberSummary(member.name, memberTasks, []);
      reportText += `${member.name}:\n${memberSummary}\n\n`;
    });

    res.status(200).json({
      success: true,
      data: {
        date: formattedDate,
        report: reportText.trim(),
        rawReport: {
          teamSummary,
          members: requiredMembers.map(m => ({
            name: m.name,
            tasks: memberReports[m.id]?.map(r => r.task_done) || []
          }))
        }
      }
    });
  } catch (error) {
    console.error('Daily Report Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate daily report'
    });
  }
};

// @route   GET /api/progress-reports/report/summary
// @desc    Generate formatted progress report summaries grouped by date
// @access  Private
export const generateReportSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Fetch all reports and enrich with user data
    const allReports = await ProgressReport.getAll('created_at', false);
    
    let filteredReports = allReports;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filteredReports = allReports.filter(report => {
        const reportDate = new Date(report.date || report.created_at);
        return reportDate >= start && reportDate <= end;
      });
    }

    // Group by date
    const groupedByDate = {};
    const userIds = new Set();
    
    filteredReports.forEach(report => {
      const dateStr = formatDateOnly(new Date(report.date || report.created_at));
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = [];
      }
      groupedByDate[dateStr].push(report);
      if (report.member_id) {
        userIds.add(report.member_id);
      }
    });

    // Fetch user data
    const usersMap = await fetchUsersMapByIds(Array.from(userIds));

    // Format summaries
    const summaries = {};
    
    for (const [dateStr, reports] of Object.entries(groupedByDate)) {
      // Group by member
      const byMember = {};
      
      reports.forEach(report => {
        const userId = String(report.member_id);
        if (!byMember[userId]) {
          byMember[userId] = [];
        }
        byMember[userId].push(report);
      });

      // Format date (e.g., "February 4")
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(year, parseInt(month) - 1, parseInt(day));
      const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
      const dayNum = parseInt(day);
      const dateHeader = `${monthName} ${dayNum}`;

      // Collect all task descriptions and extract categories
      let allTaskDescriptions = [];
      const teamPlanDescriptions = [];
      
      Object.values(byMember).forEach(memberReports => {
        memberReports.forEach(report => {
          if (report.task_done && report.task_done.trim()) {
            allTaskDescriptions.push(report.task_done);
          }
          if (report.team_plan && report.team_plan.trim()) {
            teamPlanDescriptions.push(report.team_plan);
          }
        });
      });
      
      const categories = extractCategories(allTaskDescriptions);

      // Build summary text using non-NLP fallback (Gemini Nano summarization is handled client-side)
      let summaryText = `${dateHeader}\n\n`;
      
      // Generate natural language overview
      const naturalOverview = generateNaturalSummary(allTaskDescriptions, teamPlanDescriptions);
      summaryText += `${naturalOverview}\n\n`;

      // Add member details with shortened names
      const memberTexts = [];
      Object.entries(byMember).forEach(([userId, memberReports]) => {
        const user = usersMap.get(userId);
        // Extract first name and uppercase it
        let memberName = user?.username || `User ${userId}`;
        if (user?.fullName) {
          memberName = user.fullName.split(' ')[0]; // Get first name only
        }
        memberName = memberName.toUpperCase();
        
        const memberTasks = [];
        memberReports.forEach(report => {
          if (report.task_done && report.task_done.trim()) {
            memberTasks.push(report.task_done);
          }
        });

        if (memberTasks.length > 0) {
          memberTexts.push(`${memberName}: ${memberTasks.join(', ')}.`);
        }
      });

      if (memberTexts.length > 0) {
        summaryText += memberTexts.join('\n');
      }

      summaries[dateStr] = {
        date: dateHeader,
        summary: summaryText.trim(),
        categories: categories,
        memberCount: Object.keys(byMember).length,
        taskCount: allTaskDescriptions.length
      };
    }

    res.status(200).json({
      success: true,
      data: summaries,
      period: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
