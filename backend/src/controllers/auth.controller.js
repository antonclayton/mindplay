import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { env } from '../config/env.js';

function signToken(userId) {
  if (!env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment');
  }

  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

export async function checkUsername(req, res, next) {
  try {
    const existing = await User.findOne({ username: req.query.username });
    res.json({ available: !existing });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      passwordHash,
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      user: { id: user._id, username: user.username },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id.toString());

    res.status(200).json({
      user: { id: user._id, username: user.username },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.status(200).json({ ok: true });
}
