const XAI_URL = 'https://api.x.ai/v1/chat/completions';

export async function askGrok(messages, { maxTokens } = {}) {
    const response = await fetch(XAI_URL, {
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

// Открывает поток. Ошибки до первого байта бросает как обычно (provider = true)
export async function openGrokStream(messages, signal) {
    let response;
    try {
        response = await fetch(XAI_URL, {
            method: 'POST',
            signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            },
            body: JSON.stringify({ model: 'grok-4-fast', messages, stream: true }),
        });
    } catch (cause) {
        if (cause.name === 'AbortError') throw cause;
        const error = new Error('AI provider unreachable', { cause });
        error.provider = true;
        throw error;
    }

    if (!response.ok) {
        console.error('xAI error:', response.status, await response.text());
        const error = new Error('AI provider error');
        error.provider = true;
        throw error;
    }
    return response;
}

// Генератор: отдаёт текстовые кусочки по мере прихода (та же логика, что в stream-test)
export async function* readDeltas(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') return;

            let piece;
            try {
                piece = JSON.parse(payload).choices?.[0]?.delta?.content;
            } catch {
                continue;
            }
            if (piece) yield piece;
        }
    }
}