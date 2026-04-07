import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    stats: {
      totalGames: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      rockThrows: { type: Number, default: 0 },
      paperThrows: { type: Number, default: 0 },
      scissorsThrows: { type: Number, default: 0 },
    },
    lastMoves: {
      type: [String],
      default: [],
      validate: [arr => arr.length <= 7, 'lastMoves cannot exceed 7 items'],
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export default User;
