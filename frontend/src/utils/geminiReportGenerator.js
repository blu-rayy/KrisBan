/**
 * Generate a formatted daily accomplishment report using Gemini Nano
 * @param {Object} progressReports - Reports for the day grouped by member
 * @param {string} date - Formatted date string
 * @returns {Promise<string>} - Formatted report with Gemini-generated team summary
 */
export const generateFormattedReportWithGemini = async (progressReports, date) => {
  try {
    // Check if Gemini Nano is available
    const aiModel = window.LanguageModel || window.ai?.languageModel;
    
    if (!aiModel) {
      throw new Error("Gemini Nano not available. Enable in Chrome Canary at chrome://flags/#prompt-api");
    }

    // Group reports by member
    const memberReports = {};
    const allTasks = [];
    const requiredMembers = ['KRISTIAN', 'ANGEL', 'MICHAEL', 'MARIANNE'];

    // Process reports
    progressReports.forEach(report => {
      const memberName = report.memberName || 'UNKNOWN';
      if (!memberReports[memberName]) {
        memberReports[memberName] = [];
      }
      memberReports[memberName].push(report.taskDone || '');
      if (report.taskDone) {
        allTasks.push(report.taskDone);
      }
    });

    // Create prompt for team summary
    const taskList = allTasks.join('. ');
    const summaryPrompt = `You are a project manager. Create a 1-2 sentence professional team summary of these accomplishments: ${taskList}. Be concise, formal, and no parentheses. Start directly with "The team..."`;

    // Generate team summary with Gemini
    const session = await aiModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      systemPrompt: "You are a professional project manager creating team status reports."
    });

    const teamSummary = await session.prompt(summaryPrompt);
    await session.destroy();

    // Build formatted report
    let report = `DATE: ${date}\n* ${teamSummary || 'The team accomplished multiple tasks and objectives.'}\n\n`;

    // Add each member
    requiredMembers.forEach(memberName => {
      const tasks = memberReports[memberName] || [];
      if (tasks.length > 0) {
        const taskText = tasks.filter(t => t.trim()).join('. ');
        report += `${memberName}:\n${taskText || 'No task recorded for this date.'}\n\n`;
      } else {
        report += `${memberName}:\nNo task recorded for this date.\n\n`;
      }
    });

    return report.trim();
  } catch (error) {
    console.error("Report Generation Error:", error);
    throw new Error(error.message || "Failed to generate report with Gemini Nano");
  }
};

/**
 * Fetch progress reports for a specific date and generate formatted report
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} apiUrl - Base API URL
 * @param {string} token - Auth token
 * @returns {Promise<string>} - Formatted report
 */
export const generateDailyAccomplishmentReport = async (date, apiUrl, token) => {
  try {
    // Fetch reports from backend
    const response = await fetch(`${apiUrl}/progress-reports?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch progress reports');
    }

    const data = await response.json();
    const reports = data.data || [];

    if (reports.length === 0) {
      return `DATE: ${date}\n* No team activity recorded.\n\nKRISTIAN:\nNo task recorded for this date.\n\nANGEL:\nNo task recorded for this date.\n\nMICHAEL:\nNo task recorded for this date.\n\nMARIANNE:\nNo task recorded for this date.`;
    }

    // Format date nicely
    const dateObj = new Date(date);
    const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
    const dayNum = dateObj.getDate();
    const formattedDate = `${monthName} ${dayNum}, ${dateObj.getFullYear()}`;

    // Map report data to member names
    const mappedReports = reports.map(r => ({
      memberName: extractMemberName(r.memberName || r.username || ''),
      taskDone: r.taskDone || r.task_done || ''
    }));

    // Generate formatted report with Gemini
    return await generateFormattedReportWithGemini(mappedReports, formattedDate);
  } catch (error) {
    console.error("Daily Report Error:", error);
    throw error;
  }
};

/**
 * Extract member name from full name or username
 * @param {string} name - Full name or username
 * @returns {string} - Standardized member name
 */
const extractMemberName = (name) => {
  if (!name) return 'UNKNOWN';
  
  const nameMap = {
    'kristian': 'KRISTIAN',
    'kris': 'KRISTIAN',
    'angel': 'ANGEL',
    'michael': 'MICHAEL',
    'marianne': 'MARIANNE'
  };

  const lower = String(name).toLowerCase().split(' ')[0];
  return nameMap[lower] || name.toUpperCase();
};
