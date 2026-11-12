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

const useChats = ({ onLimitReached, userId = null } = {}) => {
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatIdState] = useState(null);
    const [messages, setMessages] = useState([]);
    const [updatedHeaderTitle, setUpdateHeaderTitle] = useState('New Chat');
    const [updatedChatIcon, setUpdateChatIcon] = useState(logo);

    const activeChatIdRef = useRef(null);
    const setActive = useCallback((id) => {
        activeChatIdRef.current = id;
        setActiveChatIdState(id);
    }, []);

    const activeChat = activeChatId ? { id: activeChatId, messages } : null;

    const clearActiveChat = useCallback(() => {
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
        if (!trimmed) return;

        let chatId = activeChatIdRef.current;
        const isNewChat = !chatId;

        try {
            // 1. Если чата ещё нет, создаём его на сервере
            if (isNewChat) {
                const created = await fetch('/api/chats', { method: 'POST' });
                if (!created.ok) return;
                const data = await created.json();
                chatId = data.chat.id;
                setActive(chatId);
                setUpdateChatIcon(chatIcon);
                setUpdateHeaderTitle('New Chat');
            }

            // 2. Сразу показываем сообщение пользователя и заглушку
            const pendingId = crypto.randomUUID();
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: 'user', text: trimmed, timestamp: Date.now(), status: 'sent' },
                { id: pendingId, role: 'assistant', text: '', timestamp: Date.now(), status: 'pending' },
            ]);

            // Обновление заглушки, только если этот чат всё ещё открыт
            const updatePending = (patch) => {
                if (activeChatIdRef.current !== chatId) return;
                setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, ...patch } : m)));
            };

            // 3. Отправка на сервер: он сам сохранит, прочитает историю и спросит Grok
            let response;
            try {
                response = await fetch(`/api/chats/${chatId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: trimmed }),
                });
            } catch {
                updatePending({ status: 'error', text: 'Network error' });
                return;
            }

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

            // 4. Успех: подставляем ответ вместо заглушки
            const data = await response.json();
            updatePending({ id: data.message.id, text: data.message.content, status: 'sent' });

            // 5. Обновляем список чатов и заголовок
            setChats((prev) => [
                { id: chatId, title: data.title, updatedAt: Date.now() },
                ...prev.filter((c) => c.id !== chatId),
            ]);
            if (activeChatIdRef.current === chatId) setUpdateHeaderTitle(data.title);
        } catch (error) {
            console.error('Failed to send message:', error);
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
    };
};

export default useChats;