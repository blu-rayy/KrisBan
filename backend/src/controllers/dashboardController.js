import Board from '../models/Board.js';
import User from '../models/User.js';

// @route   GET /api/dashboard
// @desc    Get dashboard data based on user role
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('Fetching dashboard for user:', userId, 'role:', userRole);

    let dashboardData = {
      summary: {
        totalProjects: 0,
        totalCards: 0,
        role: userRole,
        progressReport: {
          activeBoards: 0,
          averageCardsPerBoard: 0,
          timestamp: new Date().toISOString()
        }
      }
    };

    // Try to fetch boards, but don't fail if unavailable
    try {
      const allBoards = await Board.find({ status: 'ACTIVE' });
      const totalBoards = allBoards.length;
      const totalCards = allBoards.reduce((sum, board) => {
        return sum + (board.columns || []).reduce((colSum, col) => colSum + (col.cards || []).length, 0);
      }, 0);

      dashboardData.summary.totalProjects = totalBoards;
      dashboardData.summary.totalCards = totalCards;
      dashboardData.summary.progressReport.activeBoards = totalBoards;
      dashboardData.summary.progressReport.averageCardsPerBoard = totalBoards > 0 ? (totalCards / totalBoards).toFixed(2) : 0;
    } catch (boardError) {
      console.warn('Could not fetch boards (this is OK if using Supabase only):', boardError.message);
      // Continue with empty board data
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load dashboard'
    });
  }
};

// @route   GET /api/dashboard/admin/progress-report
// @desc    Get detailed progress report (Admin only)
// @access  Private/Admin
export const getProgressReport = async (req, res) => {
  try {
    console.log('Fetching admin progress report...');

    const reportData = {
      totalBoards: 0,
      boardsList: [],
      cardsByPriority: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      timestamp: new Date().toISOString()
    };

    // Try to fetch boards, but don't fail if unavailable
    try {
      const allBoards = await Board.find({ status: 'ACTIVE' });

      // Fetch owner details for each board
      const boardsList = await Promise.all(
        allBoards.map(async (board) => {
          const owner = await User.findById(board.owner);
          return {
            id: board.id,
            title: board.title,
            owner: owner ? owner.email : 'Unknown',
            memberCount: (board.members || []).length,
            cardCount: (board.columns || []).reduce((sum, col) => sum + (col.cards || []).length, 0),
            columnCount: (board.columns || []).length
          };
        })
      );

      reportData.totalBoards = allBoards.length;
      reportData.boardsList = boardsList;

      // Calculate cards by priority
      allBoards.forEach(board => {
        (board.columns || []).forEach(column => {
          (column.cards || []).forEach(card => {
            if (reportData.cardsByPriority[card.priority]) {
              reportData.cardsByPriority[card.priority]++;
            }
          });
        });
      });
    } catch (boardError) {
      console.warn('Could not fetch boards (this is OK if using Supabase only):', boardError.message);
      // Continue with empty board data
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Progress report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch progress report'
    });
  }
};
