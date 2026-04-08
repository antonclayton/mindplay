import User from '../models/User.js';

export const getMyStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('stats');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ stats: user.stats });
  } catch (error) {
    next(error);
  }
};

export const updateMyStats = async (req, res, next) => {
  try {
    const { stats, newMoves } = req.body;
    if (!stats && !newMoves) {
      return res.status(400).json({ message: 'Stats or newMoves required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (stats) {
      if (!user.stats) {
        user.stats = {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          rockThrows: 0,
          paperThrows: 0,
          scissorsThrows: 0,
        };
      }

      user.stats.totalGames += stats.totalGames || 0;
      user.stats.wins += stats.wins || 0;
      user.stats.losses += stats.losses || 0;
      user.stats.draws += stats.draws || 0;
      user.stats.rockThrows += stats.rockThrows || 0;
      user.stats.paperThrows += stats.paperThrows || 0;
      user.stats.scissorsThrows += stats.scissorsThrows || 0;
    }

    if (newMoves && Array.isArray(newMoves)) {
      if (!user.lastMoves) {
        user.lastMoves = [];
      }
      user.lastMoves = [...user.lastMoves, ...newMoves].slice(-7);
    }

    await user.save();
    res.json({ stats: user.stats, lastMoves: user.lastMoves });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('username stats');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: user.username, stats: user.stats });
  } catch (error) {
    next(error);
  }
};
