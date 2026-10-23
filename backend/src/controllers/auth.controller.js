const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../config/db');
const UserModel = require('../models/user.model');

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

async function saveRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.errors });
    const { name, email, password } = parsed.data;
    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });
    // UserModel.create hashes the password internally
    const user = await UserModel.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({ success: true, accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.errors });
    const { email, password } = parsed.data;
    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ success: true, accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
    const row = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [token]);
    if (row.rowCount === 0) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ success: true, accessToken });
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout };
