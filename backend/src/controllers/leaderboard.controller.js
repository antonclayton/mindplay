import User from '../models/User.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const players = await User.find({ 'stats.totalGames': { $gte: 5 } })
      .select('username stats')
      .lean();

    const ranked = players
      .map((p) => {
        const s = p.stats;
        const score = s.wins * (s.totalGames / (s.totalGames + 10));
        const winRate = s.totalGames > 0
          ? Math.round((s.wins / s.totalGames) * 100) / 100
          : 0;
        return {
          username: p.username,
          score: Math.round(score * 100) / 100,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          totalGames: s.totalGames,
          winRate,
        };
      })
      .sort((a, b) =>
        b.score - a.score ||
        b.wins - a.wins ||
        b.totalGames - a.totalGames
      )
      .slice(0, 20)
      .map((p, i) => ({ rank: i + 1, ...p }));

    res.json({ leaderboard: ranked });
  } catch (error) {
    next(error);
  }
};
