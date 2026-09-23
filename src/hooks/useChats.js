import {useCallback, useEffect, useState} from "react";
import logo from "/src/assets/icons/logo.svg"
import chatIcon from "/src/assets/icons/chat-icon.svg"

const apiKey = import.meta.env.VITE_GROK_API_KEY;


const STORAGE_KEY = 'promptly_chats';

const useChats = () => {

    const [updatedChatIcon, setUpdateChatIcon] = useState(logo);

    // lazy initialization (link to func into useState) to read the localStorage only one time after rendering
    const [chats, setChats] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [activeChatId, setActiveChatId] = useState(null);

    // saving after changes of [chats]
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
        } catch(error) {
            console.error('Failed to save chats to localStorage:', error);
        }
    }, [chats])

    const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

    const [updatedHeaderTitle, setUpdateHeaderTitle] = useState('New Chat');

    const sendMessage = useCallback(async (text) => {
        console.log(text)
        const trimmedText = text.trim();
        if(!trimmedText) return;

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: trimmedText,
            timestamp: Date.now(),
            status: 'sent',
        };

        const targetChatId = activeChatId ?? crypto.randomUUID();

        if (!activeChat) {
            const newChat = {
                id: targetChatId,
                title: trimmedText.slice(0, 40),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: [userMessage],
            };
            setChats((prevChats) => [newChat, ...prevChats]);
            setActiveChatId(targetChatId);
            setUpdateHeaderTitle(newChat.title);
            setUpdateChatIcon(chatIcon);
        } else {
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === targetChatId
                        ? {...chat, messages: [...chat.messages, userMessage], updatedAt: Date.now()}
                        : chat
                ))
        }

        const messagesForApi = [
            ...(activeChat?.messages ?? []).map((msg) => ({
                role: msg.role,
                content: msg.text,
            })),
            {role: 'user', content: trimmedText},
        ];

        try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'grok-4-fast',
                    messages: messagesForApi,
                })
            })
            if(!response.ok) {
                const errorText = await response.text();
                console.error('Server return an error', errorText);
                return;
            }

            const data = await response.json();
            const replyText = data.choices[0].message.content;

            const assistantMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: replyText,
                timestamp: Date.now(),
                status: 'sent',
            };

            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === targetChatId
                        ? { ...chat, messages: [...chat.messages, assistantMessage], updatedAt: Date.now() }
                        : chat
                )
            );
        } catch {
            console.error('Failed to get response from Grok:', error)
        }
    }, [activeChatId, activeChat])

    const clearActiveChat = useCallback(() => {
        setActiveChatId(null);
        setUpdateHeaderTitle('New Chat');
        setUpdateChatIcon(logo);
    }, []);

    const selectChat = useCallback((chatId) => {
        setActiveChatId(chatId);
        const chat = chats.find((chat) => chat.id === chatId);
        setUpdateHeaderTitle(chat ? chat.title : "New Chat");
        setUpdateChatIcon(chatIcon);
    }, [chats])

    const deleteChat = useCallback((chatId) => {
        console.log("Deleting");
        setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    }, [])

    return {
        chats,
        activeChat,
        activeChatId,
        sendMessage,
        setActiveChatId,
        clearActiveChat,
        updatedHeaderTitle,
        updatedChatIcon,
        selectChat,
        deleteChat,
    };
}

export default useChats;