import pool from '../db.js';

const LIMITS = { guest: 10, user: 100 };
const TABLES = { guest: 'guests', user: 'users' };

// Атомарно: увеличиваем счётчик только если лимит не исчерпан.
// Возвращает { used, limit } или null, если лимит достигнут.
export async function consumeQuota(actor) {
    const limit = LIMITS[actor.type];
    const { rows } = await pool.query(
        `UPDATE ${TABLES[actor.type]}
         SET used = used + 1
         WHERE id = $1 AND used < $2
         RETURNING used`,
        [actor.id, limit]
    );
    return rows[0] ? { used: rows[0].used, limit } : null;
}

// Вернуть запрос, если он не дошёл до результата
export async function refundQuota(actor) {
    await pool.query(
        `UPDATE ${TABLES[actor.type]} SET used = GREATEST(used - 1, 0) WHERE id = $1`,
        [actor.id]
    );
}

export async function getQuota(actor) {
    const { rows } = await pool.query(
        `SELECT used FROM ${TABLES[actor.type]} WHERE id = $1`,
        [actor.id]
    );
    return { used: rows[0]?.used ?? 0, limit: LIMITS[actor.type] };
}