/**
 * Generate a professional summary using Chrome's built-in AI
 * @param {string} rawNotes - Developer task update or notes
 * @returns {Promise<string>} - Professional summary or fallback
 */
export const generateLocalSummary = async (rawNotes) => {
  try {
    // Check if Chrome AI API is available
    const aiModel = window.LanguageModel || window.ai?.languageModel;
    
    if (!aiModel) {
      return "Chrome AI not available. Please use Chrome Canary or enable the feature in chrome://flags (#prompt-api).";
    }

    // Initialize the session with specific parameters
    const session = await aiModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      systemPrompt: "You are a project manager. Summarize the following developer task update into one short, professional bullet point. Be concise and focus on the main accomplishment."
    });

    // Generate the summary
    const summary = await session.prompt(rawNotes);

    // Destroy session to prevent memory leaks
    await session.destroy();

    return summary || "Unable to generate summary.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return `Error: ${error.message || "Failed to generate summary. Please try again."}`;
  }
};
