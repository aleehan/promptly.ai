const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
        model: 'grok-4-fast',
        messages: [{ role: 'user', content: 'Расскажи в 5 предложениях, что такое инфляция' }],
        stream: true,
    }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();            // последняя строка может быть неполной: оставляем

    for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;

        const piece = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (piece) process.stdout.write(piece);
    }
}
console.log('\n--- done ---');