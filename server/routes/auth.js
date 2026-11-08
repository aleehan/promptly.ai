import express from 'express';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';
import crypto from 'node:crypto';
import requireAuth from '../middleware/requireAuth.js';
import hashToken from "../utils/token.js";
import dns from 'node:dns/promises';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts, try again later' },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIQUE_VIOLATION = '23505'; // код ошибки Postgres: нарушена уникальность


async function domainCanReceiveMail(email) {
    const domain = email.split('@')[1];
    try {
        const records = await dns.resolveMx(domain);
        return records.length > 0;
    } catch {
        return false;
    }
}

router.post('/register', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const isEmailValid = EMAIL_REGEX.test(normalizedEmail) && normalizedEmail.length <= 254;
    const isPasswordValid =
        typeof password === 'string' && password.length >= 8 && password.length <= 128;

    if (!isEmailValid || !isPasswordValid) {
        return res.status(400).json({ error: 'Invalid email or password (min 8 characters)' });
    }

    if (!(await domainCanReceiveMail(normalizedEmail))) {
        return res.status(400).json({ error: 'Email domain looks invalid' });
    }


    try {
        // 2. Хеш пароля (соль генерируется и сохраняется внутри самого хеша)
        const passwordHash = await argon2.hash(password);

        // 3. Вставка: значения только через $1, $2, никакой склейки строк
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [normalizedEmail, passwordHash]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        // 4. Такой email уже есть
        if (error.code === UNIQUE_VIOLATION) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        console.error('Register failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const DUMMY_HASH = await argon2.hash('dummy-password');

router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || typeof password !== 'string' || password.length > 128) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // 1. Ищем пользователя (индекс по lower(email) тут как раз пригодится)
        const { rows } = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE lower(email) = $1',
            [normalizedEmail]
        );
        const user = rows[0];

        // 2. Проверка пароля: всегда, даже если пользователя нет
        const isPasswordCorrect = await argon2.verify(user?.password_hash ?? DUMMY_HASH, password);

        if (!user || !isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 3. Создаём сессию: токен случайный, в базе только его хеш
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(
            'INSERT INTO sessions (id_hash, user_id, expires_at) VALUES ($1, $2, $3)',
            [hashToken(token), user.id, new Date(Date.now() + SESSION_TTL_MS)]
        );

        // 4. Cookie
        res.cookie('sid', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_TTL_MS,
        });

        res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

router.post('/logout', async (req, res) => {
    try {
        const token = req.cookies?.sid;
        if (typeof token === 'string') {
            await pool.query('DELETE FROM sessions WHERE id_hash = $1', [hashToken(token)]);
        }
        res.clearCookie('sid');
        res.json({ ok: true });
    } catch (error) {
        console.error('Logout failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;