import { useState } from 'react';
import { generateLocalSummary } from '../utils/localAI';

export const AIProgressReportSummarizer = () => {
  const [rawNotes, setRawNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSummary = async () => {
    if (!rawNotes.trim()) {
      setError('Please enter your task notes first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSummary('');

    try {
      const result = await generateLocalSummary(rawNotes);
      setSummary(result);
    } catch (err) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setRawNotes('');
    setSummary('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
            ✨ AI Task Summarizer
          </h1>
          <p className="text-slate-600">Transform messy developer notes into professional summaries instantly</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Paste Developer Task Update
            </label>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Example: Website Wireframe Sprint 6: Website Wireframe Sprint 4.5: Chapter Revisions Coded Simulation Dashboard Wireframe Refined Landing Page Wireframe Added the experiential dataset example for QMIX..."
              className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-700 placeholder-slate-400"
            />
            <p className="text-xs text-slate-500 mt-2">
              Paste messy or unstructured task notes. AI will clean them up.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating || !rawNotes.trim()}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              ✨
              {isGenerating ? 'Generating...' : 'Generate AI Summary'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition duration-200"
            >
              Clear
            </button>
          </div>

          {/* Summary Output */}
          {summary && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">✓</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">Generated Summary</h3>
                  <div className="bg-white border border-emerald-100 rounded p-4 text-slate-700 leading-relaxed">
                    • {summary}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`• ${summary}`);
                  alert('Summary copied to clipboard!');
                }}
                className="mt-3 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded text-sm transition"
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Note:</p>
            <p>This uses Chrome's experimental Prompt API. Available in Chrome Canary. Enable via <code className="bg-blue-100 px-1 rounded">chrome://flags/#prompt-api</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};
