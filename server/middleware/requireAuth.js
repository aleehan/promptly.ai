import pool from '../db.js';
import hashToken from "../utils/token.js";

export default async function requireAuth(req, res, next) {
    const token = req.cookies?.sid;
    if (typeof token !== 'string' || token.length === 0) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.email
             FROM sessions s
             JOIN users u ON u.id = s.user_id
             WHERE s.id_hash = $1 AND s.expires_at > now()`,
             [hashToken(token)]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        console.error('Auth check failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
}