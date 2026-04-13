import { wbsService } from '../services/api';

/**
 * Import a WBS board JSON payload into the current user's wbs_state.
 *
 * This is the integration point for external WBS generation pipelines.
 * Call it programmatically (e.g. from the browser console or a script)
 * after the user is authenticated — the API call uses the stored JWT.
 *
 * @param {object} json - A board object matching the WBS board schema:
 *   {
 *     name: string,
 *     summary?: string,
 *     carryForward?: string,
 *     gates?: [{ description, unblocks? }],
 *     pinnedIssues?: [{ description }],
 *     deliverables?: [{ assigneeId?, description }],
 *     wbsData: {
 *       label: string,
 *       children: [           // L1 nodes
 *         {
 *           label, assigneeId?,
 *           children: [       // L2 nodes
 *             { label, assigneeId?, status?, day?, category?, priority?, note? }
 *           ]
 *         }
 *       ]
 *     }
 *   }
 *
 * @returns {{ success: boolean, boardId?: string, error?: string }}
 */
export async function importWBSBoard(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { success: false, error: 'Payload must be a JSON object.' };
  }
  if (!json.wbsData || !Array.isArray(json.wbsData.children)) {
    return { success: false, error: 'Payload must include wbsData.children as an array.' };
  }

  try {
    const res = await wbsService.import(json);
    return { success: true, boardId: res.data.boardId };
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || 'Import failed.';
    return { success: false, error: message };
  }
}
