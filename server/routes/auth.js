import express from 'express';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';

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

router.post('/register', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    // 1. Валидация и нормализация
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const isEmailValid = EMAIL_REGEX.test(normalizedEmail) && normalizedEmail.length <= 254;
    const isPasswordValid =
        typeof password === 'string' && password.length >= 8 && password.length <= 128;

    if (!isEmailValid || !isPasswordValid) {
        return res.status(400).json({ error: 'Invalid email or password (min 8 characters)' });
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

export default router;