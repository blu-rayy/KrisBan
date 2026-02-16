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
      const allBoards = await Board.find({ status: 'ACTIVE' })
        .populate('owner', 'email name')
        .populate('members', 'email name');

      const totalBoards = allBoards.length;
      const totalCards = allBoards.reduce((sum, board) => {
        return sum + board.columns.reduce((colSum, col) => colSum + col.cards.length, 0);
      }, 0);

      dashboardData.boards = allBoards;
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
      const userBoards = await Board.find({
        $or: [{ owner: userId }, { members: userId }],
        status: 'ACTIVE'
      })
        .populate('owner', 'email name')
        .populate('members', 'email name');

      const totalCards = userBoards.reduce((sum, board) => {
        return sum + board.columns.reduce((colSum, col) => colSum + col.cards.length, 0);
      }, 0);

      dashboardData.boards = userBoards;
      dashboardData.summary = {
        totalBoards: userBoards.length,
        totalCards: totalCards,
        role: 'USER',
        userInfo: {
          asOwner: userBoards.filter(b => b.owner._id.toString() === userId).length,
          asMember: userBoards.filter(b => b.members.some(m => m._id.toString() === userId)).length
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
    const allBoards = await Board.find({ status: 'ACTIVE' })
      .populate('owner', 'email name')
      .populate('members', 'email name');

    const reportData = {
      totalBoards: allBoards.length,
      boardsList: allBoards.map(board => ({
        id: board._id,
        title: board.title,
        owner: board.owner.email,
        memberCount: board.members.length,
        cardCount: board.columns.reduce((sum, col) => sum + col.cards.length, 0),
        columnCount: board.columns.length
      })),
      cardsByPriority: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      timestamp: new Date()
    };

    // Calculate cards by priority
    allBoards.forEach(board => {
      board.columns.forEach(column => {
        column.cards.forEach(card => {
          reportData.cardsByPriority[card.priority]++;
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
