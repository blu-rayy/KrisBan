/**
 * Generate a formatted daily accomplishment report using Gemini Nano
 * @param {Object} progressReports - Reports for the day grouped by member
 * @param {string} date - Formatted date string
 * @returns {Promise<string>} - Team summary and member lines in fixed format
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
      const memberName = extractMemberName(report.memberName || 'UNKNOWN');
      if (!memberReports[memberName]) {
        memberReports[memberName] = [];
      }
      memberReports[memberName].push(report.taskDone || '');
      if (report.taskDone) {
        allTasks.push(report.taskDone);
      }
    });

    const buildFallbackSummary = () => {
      return 'The team completed planned work items and updated project deliverables for this date. The completed activities support current implementation and documentation objectives.';
    };

    const truncateToWordLimit = (text, limit = 11) => {
      const cleaned = String(text || '').replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
      if (!cleaned) return 'No task recorded for this date.';
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length <= limit) return cleaned;
      return words.slice(0, limit).join(' ');
    };

    const enforceTeamSummaryRules = (rawSummary) => {
      const cleaned = String(rawSummary || '').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

      const summaryWithoutNames = cleaned
        .replace(/\bKRISTIAN\b/gi, 'the team')
        .replace(/\bANGEL\b/gi, 'the team')
        .replace(/\bMICHAEL\b/gi, 'the team')
        .replace(/\bMARIANNE\b/gi, 'the team')
        .replace(/^\*+\s*/g, '')
        .replace(/^\*+\s*Team\s*Summary\s*:?\s*/i, '')
        .replace(/^Team\s*Summary\s*:\s*/i, '')
        .replace(/\bTeam\s*Summary\b\s*:?/gi, '')
        .replace(/^(Daily\s+Accomplishment\s+Report\s*)/i, '')
        .replace(/\bDate\s*:\s*[A-Za-z]+\s+\d{1,2},\s*\d{4}\b/gi, '')
        .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\b/gi, '')
        .replace(/^Date\s*:\s*[^.\n]*\.?\s*/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const sentenceCandidates = summaryWithoutNames
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      const uniqueSentences = [];
      const seen = new Set();
      sentenceCandidates.forEach((sentence) => {
        const key = sentence.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueSentences.push(sentence);
        }
      });

      let selectedSentences = uniqueSentences.slice(0, 3);
      if (selectedSentences.length < 2) {
        return buildFallbackSummary();
      }

      return selectedSentences.slice(0, 3).join(' ');
    };

    const buildMemberLinesFromData = () => {
      return requiredMembers
        .map((memberName) => {
          const tasks = (memberReports[memberName] || []).filter((task) => String(task || '').trim());
          const memberTask = tasks.length > 0 ? truncateToWordLimit(tasks[0], 11) : 'No task recorded for this date.';
          return `${memberName}: ${memberTask}`;
        })
        .join('\n');
    };

    // If no accomplishments were provided, skip Gemini prompt and return deterministic fallback
    if (allTasks.length === 0) {
      return `The team recorded no completed tasks for this date. No accomplishments were submitted for reporting.\n\nKRISTIAN: No task recorded for this date.\nANGEL: No task recorded for this date.\nMICHAEL: No task recorded for this date.\nMARIANNE: No task recorded for this date.`;
    }

    const inputByMember = requiredMembers
      .map((memberName) => {
        const tasks = (memberReports[memberName] || []).filter((task) => task && String(task).trim());
        return `${memberName}: ${tasks.length ? tasks.join(' | ') : 'No task recorded for this date.'}`;
      })
      .join('\n');

    const reportPrompt = [
      'Generate a daily accomplishment report.',
      '',
      'Output Rules:',
      '- Output this exact section order and labels:',
      'Team summary',
      'KRISTIAN:',
      'ANGEL:',
      'MICHAEL:',
      'MARIANNE:',
      '- Write 2 to 3 sentences for the team summary.',
      '- Describe the team collective work only.',
      '- Do not mention any individual names.',
      '- Do not restate individual tasks in detail.',
      '- Summarize shared direction, focus, or outcome.',
      '- Keep it professional and documentation-ready.',
      '- Avoid exaggerated or dramatic language.',
      '- For each member line, output one concise task-focused phrase under 12 words.',
      '- If no task, use exactly No task recorded for this date.',
      '- Do not use parentheses.',
      '- Do not use markdown symbols like *, **, or #.',
      '',
      `Date: ${date}`,
      'Raw input:',
      inputByMember
    ].join('\n');

    // Generate report with Gemini
    const session = await aiModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      systemPrompt: "You write formal daily accomplishment reports in strict template format."
    });

    const aiOutput = await session.prompt(reportPrompt);
    await session.destroy();

    const outputText = String(aiOutput || '').replace(/[()]/g, '').trim();
    const lines = outputText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const firstMemberLineIndex = lines.findIndex((line) => /^(KRISTIAN|ANGEL|MICHAEL|MARIANNE):/i.test(line));
    const summaryBlockLines = firstMemberLineIndex >= 0 ? lines.slice(0, firstMemberLineIndex) : lines;

    const summaryCandidates = summaryBlockLines
      .map((line) => line
        .replace(/^\*+\s*/g, '')
        .replace(/^#+\s*/g, '')
        .replace(/^Team\s*Summary\s*:\s*/i, '')
        .replace(/^Team\s*Summary\s*$/i, '')
        .replace(/^Date\s*:\s*[A-Za-z]+\s+\d{1,2},\s*\d{4}$/i, '')
        .replace(/^Date\s*:\s*$/i, '')
        .trim())
      .filter(Boolean);

    const summarySource = summaryCandidates.join(' ').trim();
    const summaryText = summarySource ? enforceTeamSummaryRules(summarySource) : buildFallbackSummary();

    const memberEntries = {};
    requiredMembers.forEach((memberName) => {
      const memberLine = lines.find((line) => new RegExp(`^${memberName}:`, 'i').test(line.trim()));
      if (!memberLine) {
        const tasks = (memberReports[memberName] || []).filter((task) => String(task || '').trim());
        memberEntries[memberName] = tasks.length ? truncateToWordLimit(tasks[0], 11) : 'No task recorded for this date.';
        return;
      }

      const value = memberLine.split(':').slice(1).join(':').trim();
      memberEntries[memberName] = truncateToWordLimit(value || 'No task recorded for this date.', 11);
    });

    const memberLines = requiredMembers
      .map((memberName) => `${memberName}: ${memberEntries[memberName] || 'No task recorded for this date.'}`)
      .join('\n');

    return `${summaryText.trim()}\n\n${memberLines}`;
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
 * @returns {Promise<string>} - Team summary and member lines in fixed format
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
      return `The team recorded no completed tasks for this date. No accomplishments were submitted for reporting.\n\nKRISTIAN: No task recorded for this date.\nANGEL: No task recorded for this date.\nMICHAEL: No task recorded for this date.\nMARIANNE: No task recorded for this date.`;
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
