import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import cookieParser from 'cookie-parser';

import identify from './middleware/identify.js';
import { getQuota } from './utils/quota.js';

import chatsRouter from './routes/chats.js';

const app = express();

if (!process.env.XAI_API_KEY) {
    console.error('XAI_API_KEY is not set. Start the server with --env-file=server/.env');
    process.exit(1);
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({limit: '100kb'}));
app.use(cookieParser());

app.use('/api', authRouter);
app.use('/api/chats', chatsRouter);

app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Server is working' });
});

app.get('/api/quota', identify, async (req, res) => {
    try {
        const { used, limit } = await getQuota(req.actor);
        res.json({ type: req.actor.type, used, limit, remaining: limit - used });
    } catch (error) {
        console.error('Quota request failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});