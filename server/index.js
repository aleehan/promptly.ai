import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

const SYSTEM_PROMPT = [
    'You are Promptly, a friendly AI assistant built into the Promptly app to help users with their personal finances — budgeting, expense analysis, savings planning, and financial scenario planning. Never mention that you are Grok or that you were developed by xAI — you are Promptly.',

    'Reply in the same language the user writes in (Russian if they write in Russian, English if they write in English, and so on).',

    'When writing tables, use standard GitHub-Flavored Markdown table syntax (pipes and dashes).',

    'When writing math formulas, use LaTeX syntax wrapped in dollar signs: $formula$ for inline formulas within a sentence, and $$formula$$ for formulas on their own line. Never wrap formulas in square brackets or any other delimiter.',

    'When a chart would help the user understand numeric data (spending breakdowns, savings progress, comparisons over time), include it as a fenced code block with the language "chart", containing a single JSON object:',
    '{"type": "bar" | "line" | "pie", "title": "string", "data": [{"name": "string", "value": number}]}',
    'Use valid JSON only (double quotes, no comments, no trailing commas). Keep explanations outside the block, in normal text.',

    'Example of the required format:',
    '```chart',
    '{"type": "pie", "title": "Monthly expenses", "data": [{"name": "Food", "value": 15000}, {"name": "Transport", "value": 4500}]}',
    '```',

    'The opening fence MUST be exactly ```chart (the word "chart" right after the three backticks).',
].join('\n');

const TITLE_SYSTEM_PROMPT = [
    'Write a short, natural title for this conversation, the way a thoughtful person would label a note to find it later.',
    'Use 2 to 5 words. Capture the specific topic or the user\'s goal, not a generic category.',
    'Prefer concrete wording over bureaucratic phrasing: "Saving for a laptop by June" instead of "Savings Plan Request", "Where my money goes" instead of "Expense Analysis".',
    'Do not start with words like "Request", "Question", "Help with", "Discussion" or "User".',
    'Write the title in the same language the user wrote in.',
    'No quotation marks, no emoji, no trailing punctuation, no explanation.',
    'Reply with the title only.',
].join(' ');

const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 20000;

if (!process.env.XAI_API_KEY) {
    console.error('XAI_API_KEY is not set. Start the server with --env-file=server/.env');
    process.exit(1);
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({limit: '100kb'}));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,            
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, try again in a minute' },
});

app.use('/api/chat', apiLimiter);
app.use('/api/title', apiLimiter);

app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Server is working' });
});

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    // 1. Проверка входа
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
        return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const isValid = messages.every(
        (m) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.length > 0 &&
            m.content.length <= MAX_CONTENT_LENGTH

    );

    if (!isValid) {
        return res.status(400).json({ error: 'invalid message format' });
    }

    // 2. Сборка запроса
    const messagesForApi = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // 3. Запрос к xAI
    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            },
            body: JSON.stringify({ model: 'grok-4-fast', messages: messagesForApi }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('xAI error:', response.status, errorText);
            return res.status(502).json({ error: 'AI provider error' });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        if (typeof reply !== 'string') {
            console.error('Unexpected xAI response shape:', data);
            return res.status(502).json({ error: 'AI provider returned an unexpected response' });
        }

        res.json({ reply });
    } catch (error) {
        console.error('Chat request failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/title', async (req, res) => {
    const { userText, assistantText } = req.body;

    const isValid = [userText, assistantText].every(
        (t) => typeof t === 'string' && t.length > 0 && t.length <= MAX_CONTENT_LENGTH
    );
    if (!isValid) {
        return res.status(400).json({ error: 'invalid input' });
    }

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'grok-4-fast',
                messages: [
                    { role: 'system', content: TITLE_SYSTEM_PROMPT },
                    { role: 'user', content: userText },
                    { role: 'assistant', content: assistantText },
                ],
                max_tokens: 20,
            }),
        });

        if (!response.ok) {
            console.error('xAI title error:', response.status, await response.text());
            return res.status(502).json({ error: 'AI provider error' });
        }

        const data = await response.json();
        const title = data.choices?.[0]?.message?.content?.trim();

        if (!title) return res.status(502).json({ error: 'empty title' });
        res.json({ title });
    } catch (error) {
        console.error('Title request failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});