import Board from '../models/Board.js';
import User from '../models/User.js';

// @route   GET /api/dashboard
// @desc    Get dashboard data based on user role
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find user details
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let dashboardData = {
      user: user.getPublicProfile(),
      boards: [],
      summary: {}
    };

    if (userRole === 'ADMIN') {
      // Admin gets all projects and progress report tools
      const allBoards = await Board.find({ status: 'ACTIVE' });

      // Fetch owner and member details
      const enrichedBoards = await Promise.all(
        allBoards.map(async (board) => {
          const owner = await User.findById(board.owner);
          const memberUsers = await Promise.all(
            (board.members || []).map(memberId => User.findById(memberId))
          );

          return {
            ...board,
            owner: owner ? { email: owner.email, name: owner.name } : null,
            members: memberUsers.map(m => m ? { email: m.email, name: m.name } : null).filter(Boolean)
          };
        })
      );

      const totalBoards = enrichedBoards.length;
      const totalCards = enrichedBoards.reduce((sum, board) => {
        return sum + (board.columns || []).reduce((colSum, col) => colSum + (col.cards || []).length, 0);
      }, 0);

      dashboardData.boards = enrichedBoards;
      dashboardData.summary = {
        totalProjects: totalBoards,
        totalCards: totalCards,
        role: 'ADMIN',
        progressReport: {
          activeBoards: totalBoards,
          averageCardsPerBoard: totalBoards > 0 ? (totalCards / totalBoards).toFixed(2) : 0,
          timestamp: new Date()
        }
      };
    } else {
      // Standard User gets only assigned Kanban boards
      const allBoards = await Board.find({ status: 'ACTIVE' });

      // Filter for boards where user is owner or member
      const userBoards = allBoards.filter(
        board => board.owner === userId || (board.members || []).includes(userId)
      );

      // Fetch owner and member details
      const enrichedBoards = await Promise.all(
        userBoards.map(async (board) => {
          const owner = await User.findById(board.owner);
          const memberUsers = await Promise.all(
            (board.members || []).map(memberId => User.findById(memberId))
          );

          return {
            ...board,
            owner: owner ? { _id: owner.id, email: owner.email, name: owner.name } : null,
            members: memberUsers.map(m => m ? { _id: m.id, email: m.email, name: m.name } : null).filter(Boolean)
          };
        })
      );

      const totalCards = enrichedBoards.reduce((sum, board) => {
        return sum + (board.columns || []).reduce((colSum, col) => colSum + (col.cards || []).length, 0);
      }, 0);

      dashboardData.boards = enrichedBoards;
      dashboardData.summary = {
        totalBoards: enrichedBoards.length,
        totalCards: totalCards,
        role: 'USER',
        userInfo: {
          asOwner: enrichedBoards.filter(b => b.owner && b.owner._id === userId).length,
          asMember: enrichedBoards.filter(b => (b.members || []).some(m => m._id === userId)).length
        }
      };
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/dashboard/admin/progress-report
// @desc    Get detailed progress report (Admin only)
// @access  Private/Admin
export const getProgressReport = async (req, res) => {
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

    const reportData = {
      totalBoards: allBoards.length,
      boardsList: boardsList,
      cardsByPriority: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      timestamp: new Date()
    };

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

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
