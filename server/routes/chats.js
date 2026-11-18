import express from 'express';
import pool from '../db.js';
import identify from '../middleware/identify.js';
import rateLimit from 'express-rate-limit';
import { consumeQuota, refundQuota } from '../utils/quota.js';
import { askGrok, openGrokStream, readDeltas } from '../utils/grok.js';
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
    let streaming = false;
    let finished = false;

    // Если клиент закрыл соединение (Stop, закрыл вкладку), обрываем запрос к xAI
    const controller = new AbortController();
    res.on('close', () => {
        if (!finished) controller.abort();
    });

    const send = (event, data) => {
        if (res.writableEnded || res.destroyed) return;
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const rollback = async () => {
        if (charged) await refundQuota(req.actor).catch(() => {});
        if (userMessageId) {
            await pool.query('DELETE FROM messages WHERE id = $1', [userMessageId]).catch(() => {});
        }
        charged = false;
        userMessageId = null;
    };

    try {
        const chatId = req.params.id;
        const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

        if (!UUID_RE.test(chatId)) return res.status(404).json({ error: 'Not found' });
        if (!content || content.length > MAX_CONTENT_LENGTH) {
            return res.status(400).json({ error: 'Invalid message' });
        }

        const chat = await pool.query(
            `SELECT id, title FROM chats WHERE id = $1 AND ${ownerColumn(req.actor)} = $2`,
            [chatId, req.actor.id]
        );
        if (!chat.rows[0]) return res.status(404).json({ error: 'Not found' });

        const quota = await consumeQuota(req.actor);
        if (!quota) {
            return res.status(403).json({
                error: 'Request limit reached',
                code: 'LIMIT_REACHED',
                type: req.actor.type,
            });
        }
        charged = true;

        const inserted = await pool.query(
            `INSERT INTO messages (chat_id, role, content) VALUES ($1, 'user', $2) RETURNING id`,
            [chatId, content]
        );
        userMessageId = inserted.rows[0].id;

        const history = await pool.query(
            `SELECT role, content FROM (
                 SELECT role, content, seq FROM messages
                 WHERE chat_id = $1 AND status = 'sent'
                 ORDER BY seq DESC LIMIT $2
             ) recent ORDER BY seq`,
            [chatId, HISTORY_LIMIT]
        );
        const isFirstExchange = history.rows.length === 1;

        // Открываем поток к xAI. Если не вышло, ответим обычным JSON (заголовки ещё не отправлены)
        const upstream = await openGrokStream(
            [{ role: 'system', content: SYSTEM_PROMPT }, ...history.rows],
            controller.signal
        );

        // С этого момента отвечаем потоком
        res.status(200).set({
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        res.flushHeaders();
        streaming = true;

        let text = '';
        try {
            for await (const piece of readDeltas(upstream)) {
                text += piece;
                send('delta', { text: piece });
            }
        } catch (error) {
            if (error.name !== 'AbortError') throw error;
        }

        const aborted = controller.signal.aborted;
        finished = true;

        // Ничего не пришло: откатываем, как будто запроса не было
        if (!text.trim()) {
            await rollback();
            send('error', { error: aborted ? 'Stopped' : 'Empty response' });
            return res.end();
        }

        // Сохраняем то, что успело прийти (даже если пользователь нажал Stop)
        const saved = await pool.query(
            `INSERT INTO messages (chat_id, role, content) VALUES ($1, 'assistant', $2)
             RETURNING id, created_at`,
            [chatId, text]
        );

        send('done', {
            message: { id: saved.rows[0].id, content: text, created_at: saved.rows[0].created_at },
            remaining: quota.limit - quota.used,
            stopped: aborted,
        });

        // Заголовок и время обновления: необязательно, ошибки не ломают ответ
        let title = chat.rows[0].title;
        try {
            if (isFirstExchange && !aborted) {
                const generated = await askGrok(
                    [
                        { role: 'system', content: TITLE_SYSTEM_PROMPT },
                        { role: 'user', content },
                        { role: 'assistant', content: text },
                    ],
                    { maxTokens: 32 }
                );
                if (generated) title = generated.slice(0, 80);
            }
            await pool.query(
                'UPDATE chats SET title = $2, updated_at = now() WHERE id = $1',
                [chatId, title]
            );
            if (title !== chat.rows[0].title) send('title', { title });
        } catch (error) {
            console.error('Post-reply update failed:', error);
        }

        res.end();
    } catch (error) {
        if (error.name !== 'AbortError') console.error('Send message failed:', error);
        finished = true;
        await rollback();

        const message = error.provider ? 'AI provider error' : 'Server error';
        if (streaming) {
            send('error', { error: message });
            res.end();
        } else if (!res.headersSent) {
            res.status(error.provider ? 502 : 500).json({ error: message });
        }
    }
});

export default router;