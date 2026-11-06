import pool from '../db.js';
import  hashToken from '../utils/token.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

export default async function identify(req, res, next) {
    try {
        // 1. Вошедший пользователь
        const sid = req.cookies?.sid;
        if (typeof sid === 'string' && sid.length > 0) {
            const { rows } = await pool.query(
                `SELECT u.id, u.email
                 FROM sessions s
                 JOIN users u ON u.id = s.user_id
                 WHERE s.id_hash = $1 AND s.expires_at > now()`,
                [hashToken(sid)]
            );
            if (rows[0]) {
                req.user = rows[0];
                req.actor = { type: 'user', id: rows[0].id };
                return next();
            }
        }

        // 2. Известный гость
        let guestId = req.cookies?.gid;
        if (typeof guestId === 'string' && UUID_RE.test(guestId)) {
            const { rows } = await pool.query('SELECT id FROM guests WHERE id = $1', [guestId]);
            if (rows.length === 0) guestId = null;
        } else {
            guestId = null;
        }

        // 3. Новый гость
        if (!guestId) {
            const { rows } = await pool.query('INSERT INTO guests DEFAULT VALUES RETURNING id');
            guestId = rows[0].id;
            res.cookie('gid', guestId, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: GUEST_COOKIE_MAX_AGE,
            });
        }

        req.actor = { type: 'guest', id: guestId };
        next();
    } catch (error) {
        console.error('identify failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
}