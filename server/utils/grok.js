export async function askGrok(messages, { maxTokens } = {}) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'grok-4-fast',
            messages,
            ...(maxTokens ? { max_tokens: maxTokens } : {}),
        }),
    });

    if (!response.ok) {
        console.error('xAI error:', response.status, await response.text());
        const error = new Error('AI provider error');
        error.provider = true;
        throw error;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string') {
        const error = new Error('Unexpected AI response');
        error.provider = true;
        throw error;
    }
    return reply.trim();
}