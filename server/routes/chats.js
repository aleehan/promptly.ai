import express from 'express';
import pool from '../db.js';
import identify from '../middleware/identify.js';
import rateLimit from 'express-rate-limit';
import { consumeQuota, refundQuota } from '../utils/quota.js';
import { askGrok } from '../utils/grok.js';
import { SYSTEM_PROMPT, TITLE_SYSTEM_PROMPT } from '../prompts.js';

const MAX_CONTENT_LENGTH = 20000;
const HISTORY_LIMIT = 40;

const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, try again in a minute' },
});

const router = express.Router();
router.use(identify);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Имя колонки берём из фиксированной функции, а не из ввода пользователя
const ownerColumn = (actor) => (actor.type === 'user' ? 'user_id' : 'guest_id');


// Список чатов текущего владельца
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, title, updated_at FROM chats
             WHERE ${ownerColumn(req.actor)} = $1
             ORDER BY updated_at DESC`,
            [req.actor.id]
        );
        res.json({ chats: rows });
    } catch (error) {
        console.error('List chats failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', messageLimiter, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `INSERT INTO chats (${ownerColumn(req.actor)}) VALUES ($1)
             RETURNING id, title, updated_at`,
            [req.actor.id]
        );
        res.status(201).json({ chat: rows[0] });
    } catch (error) {
        console.error('Create chat failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Один чат с сообщениями
router.get('/:id', async (req, res) => {
    try {
        if (!UUID_RE.test(req.params.id)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const chat = await pool.query(
            `SELECT id, title FROM chats
             WHERE id = $1 AND ${ownerColumn(req.actor)} = $2`,
            [req.params.id, req.actor.id]
        );
        if (!chat.rows[0]) {
            return res.status(404).json({ error: 'Not found' });
        }

        const messages = await pool.query(
            `SELECT id, role, content, status, created_at
             FROM messages WHERE chat_id = $1 ORDER BY seq`,
            [req.params.id]
        );
        res.json({ chat: chat.rows[0], messages: messages.rows });
    } catch (error) {
        console.error('Get chat failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление чата
router.delete('/:id', async (req, res) => {
    try {
        if (!UUID_RE.test(req.params.id)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const result = await pool.query(
            `DELETE FROM chats WHERE id = $1 AND ${ownerColumn(req.actor)} = $2`,
            [req.params.id, req.actor.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({ ok: true });
    } catch (error) {
        console.error('Delete chat failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/messages', messageLimiter, async (req, res) => {
    let charged = false;
    let userMessageId = null;

    try {
        const chatId = req.params.id;
        const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

        if (!UUID_RE.test(chatId)) {
            return res.status(404).json({ error: 'Not found' });
        }
        if (!content || content.length > MAX_CONTENT_LENGTH) {
            return res.status(400).json({ error: 'Invalid message' });
        }

        // 1. Чат существует и принадлежит этому актору
        const chat = await pool.query(
            `SELECT id, title FROM chats WHERE id = $1 AND ${ownerColumn(req.actor)} = $2`,
            [chatId, req.actor.id]
        );
        if (!chat.rows[0]) {
            return res.status(404).json({ error: 'Not found' });
        }

        // 2. Квота (атомарно)
        const quota = await consumeQuota(req.actor);
        if (!quota) {
            return res.status(403).json({
                error: 'Request limit reached',
                code: 'LIMIT_REACHED',
                type: req.actor.type,
            });
        }
        charged = true;

        // 3. Сохраняем сообщение пользователя
        const inserted = await pool.query(
            `INSERT INTO messages (chat_id, role, content) VALUES ($1, 'user', $2)
             RETURNING id`,
            [chatId, content]
        );
        userMessageId = inserted.rows[0].id;

        // 4. История: последние N успешных сообщений в правильном порядке
        const history = await pool.query(
            `SELECT role, content FROM (
                 SELECT role, content, seq FROM messages
                 WHERE chat_id = $1 AND status = 'sent'
                 ORDER BY seq DESC LIMIT $2
             ) recent ORDER BY seq`,
            [chatId, HISTORY_LIMIT]
        );

        // 5. Ответ модели
        const reply = await askGrok([
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.rows,
        ]);

        // 6. Сохраняем ответ и обновляем чат
        const saved = await pool.query(
            `INSERT INTO messages (chat_id, role, content) VALUES ($1, 'assistant', $2)
             RETURNING id, created_at`,
            [chatId, reply]
        );

        // 7. Заголовок и время обновления: необязательно, ошибки не ломают ответ
        let title = chat.rows[0].title;
        try {
            if (history.rows.length === 1) {
                const generated = await askGrok(
                    [
                        { role: 'system', content: TITLE_SYSTEM_PROMPT },
                        { role: 'user', content: content },
                        { role: 'assistant', content: reply },
                    ],
                    { maxTokens: 32 }
                );
                if (generated) title = generated.slice(0, 80);
            }

            await pool.query(
                'UPDATE chats SET title = $2, updated_at = now() WHERE id = $1',
                [chatId, title]
            );
        } catch (error) {
            console.error('Post-reply update failed:', error);
        }

        res.json({
            message: { id: saved.rows[0].id, role: 'assistant', content: reply, created_at: saved.rows[0].created_at },
            title,
            remaining: quota.limit - quota.used,
        });
    } catch (error) {
        console.error('Send message failed:', error);

        // Откат: возвращаем запрос и убираем сообщение, на которое нет ответа
        if (charged) await refundQuota(req.actor).catch(() => {});
        if (userMessageId) {
            await pool.query('DELETE FROM messages WHERE id = $1', [userMessageId]).catch(() => {});
        }

        if (!res.headersSent) {
            res.status(error.provider ? 502 : 500).json({
                error: error.provider ? 'AI provider error' : 'Server error',
            });
        }
    }
});

export default router;