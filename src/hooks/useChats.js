import { useCallback, useEffect, useRef, useState } from "react";
import logo from "/src/assets/icons/logo.svg";
import chatIcon from "/src/assets/icons/chat-icon.svg";

// Формат сервера -> формат, который ждут Message и MessageList
const toClientMessage = (m) => ({
    id: m.id,
    role: m.role,
    text: m.content,
    timestamp: new Date(m.created_at).getTime(),
    status: m.status,
});

const toClientChat = (c) => ({
    id: c.id,
    title: c.title,
    updatedAt: new Date(c.updated_at).getTime(),
});

// Читает события потока: блоки "event: ...\ndata: {...}\n\n"
async function* readEvents(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');   // событие заканчивается пустой строкой
        buffer = blocks.pop();                 // хвост может быть неполным

        for (const block of blocks) {
            let event = 'message';
            let data = '';
            for (const line of block.split('\n')) {
                if (line.startsWith('event:')) event = line.slice(6).trim();
                else if (line.startsWith('data:')) data += line.slice(5).trim();
            }
            if (data) yield { event, data: JSON.parse(data) };
        }
    }
}

const useChats = ({ onLimitReached, userId = null } = {}) => {
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatIdState] = useState(null);
    const [messages, setMessages] = useState([]);
    const [updatedHeaderTitle, setUpdateHeaderTitle] = useState('New Chat');
    const [updatedChatIcon, setUpdateChatIcon] = useState(logo);
    const [isGenerating, setIsGenerating] = useState(false);

    const activeChatIdRef = useRef(null);
    const isGeneratingRef = useRef(false);
    const abortRef = useRef(null);

    const setActive = useCallback((id) => {
        activeChatIdRef.current = id;
        setActiveChatIdState(id);
    }, []);

    const stopGeneration = useCallback(() => abortRef.current?.abort(), []);

    const activeChat = activeChatId ? { id: activeChatId, messages } : null;

    const clearActiveChat = useCallback(() => {
        abortRef.current?.abort();
        setActive(null);
        setMessages([]);
        setUpdateHeaderTitle('New Chat');
        setUpdateChatIcon(logo);
    }, [setActive]);

    const loadChats = useCallback(async () => {
        try {
            const response = await fetch('/api/chats');
            if (!response.ok) return;
            const data = await response.json();
            setChats(data.chats.map(toClientChat));
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    }, []);

    // При загрузке и при смене пользователя (вход/выход) чаты другие
    useEffect(() => {
        clearActiveChat();
        setChats([]);
        loadChats();
    }, [userId, loadChats, clearActiveChat]);

    const selectChat = useCallback(async (chatId) => {
        abortRef.current?.abort();
        setActive(chatId);
        setMessages([]);
        setUpdateChatIcon(chatIcon);
        try {
            const response = await fetch(`/api/chats/${chatId}`);
            if (!response.ok) return;
            const data = await response.json();
            if (activeChatIdRef.current !== chatId) return; // пока грузилось, выбрали другой
            setMessages(data.messages.map(toClientMessage));
            setUpdateHeaderTitle(data.chat.title);
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    }, [setActive]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed || isGeneratingRef.current) return;

        isGeneratingRef.current = true;
        setIsGenerating(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            let chatId = activeChatIdRef.current;

            // 1. Новый чат создаём на сервере
            if (!chatId) {
                const created = await fetch('/api/chats', { method: 'POST' });
                if (!created.ok) return;
                chatId = (await created.json()).chat.id;
                setActive(chatId);
                setUpdateChatIcon(chatIcon);
                setUpdateHeaderTitle('New Chat');
            }

            // 2. Сразу показываем вопрос и заглушку
            const userMsgId = crypto.randomUUID();
            const pendingId = crypto.randomUUID();
            setMessages((prev) => [
                ...prev,
                { id: userMsgId, role: 'user', text: trimmed, timestamp: Date.now(), status: 'sent' },
                { id: pendingId, role: 'assistant', text: '', timestamp: Date.now(), status: 'pending' },
            ]);

            const updatePending = (patch) => {
                if (activeChatIdRef.current !== chatId) return;
                setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, ...patch } : m)));
            };
            const removeOptimistic = () => {
                if (activeChatIdRef.current !== chatId) return;
                setMessages((prev) => prev.filter((m) => m.id !== userMsgId && m.id !== pendingId));
            };

            // 3. Запрос
            let response;
            try {
                response = await fetch(`/api/chats/${chatId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: trimmed }),
                    signal: controller.signal,
                });
            } catch (error) {
                if (error.name === 'AbortError') removeOptimistic();
                else updatePending({ status: 'error', text: 'Network error' });
                return;
            }

            // 4. Обычные ошибки приходят JSON-ом
            if (!response.ok) {
                let errorData = {};
                try { errorData = await response.json(); } catch { /* пустое тело */ }

                const isLimit = response.status === 403 && errorData.code === 'LIMIT_REACHED';
                let errorLabel = 'Error with fetching answer';
                if (isLimit) {
                    errorLabel = errorData.type === 'guest'
                        ? 'Free requests are over. Sign up to continue.'
                        : 'Request limit reached.';
                } else if (response.status === 429) {
                    errorLabel = 'Too many requests. Wait a minute and try again.';
                }

                updatePending({ status: 'error', text: errorLabel });
                if (isLimit && errorData.type === 'guest') onLimitReached?.();
                return;
            }

            // 5. Поток
            let acc = '';
            let finished = false;
            let serverError = null;

            try {
                for await (const { event, data } of readEvents(response)) {
                    if (event === 'delta') {
                        acc += data.text;
                        updatePending({ status: 'streaming', text: acc });
                    } else if (event === 'done') {
                        finished = true;
                        updatePending({ id: data.message.id, text: data.message.content, status: 'sent' });
                        setChats((prev) => [
                            {
                                id: chatId,
                                title: prev.find((c) => c.id === chatId)?.title ?? 'New Chat',
                                updatedAt: Date.now(),
                            },
                            ...prev.filter((c) => c.id !== chatId),
                        ]);
                    } else if (event === 'title') {
                        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: data.title } : c)));
                        if (activeChatIdRef.current === chatId) setUpdateHeaderTitle(data.title);
                    } else if (event === 'error') {
                        serverError = data.error;
                    }
                }
            } catch (error) {
                if (error.name !== 'AbortError') console.error('Stream failed:', error);
            }

            // 6. Поток закончился без done
            if (!finished) {
                if (serverError && serverError !== 'Stopped') {
                    updatePending({ status: 'error', text: 'Error with fetching answer' });
                } else if (acc) {
                    updatePending({ status: 'sent' });          // Stop: частичный ответ остаётся
                } else if (controller.signal.aborted || serverError === 'Stopped') {
                    removeOptimistic();                         // Stop до первого символа
                } else {
                    updatePending({ status: 'error', text: 'Connection lost' });
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            if (abortRef.current === controller) abortRef.current = null;
            isGeneratingRef.current = false;
            setIsGenerating(false);
        }
    }, [onLimitReached, setActive]);

    const deleteChat = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
            if (!response.ok && response.status !== 404) return;
        } catch (error) {
            console.error('Failed to delete chat:', error);
            return;
        }
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChatIdRef.current === chatId) clearActiveChat();
    }, [clearActiveChat]);

    return {
        chats,
        activeChat,
        activeChatId,
        sendMessage,
        clearActiveChat,
        updatedHeaderTitle,
        updatedChatIcon,
        selectChat,
        deleteChat,
        isGenerating,
        stopGeneration,
    };
};

export default useChats;