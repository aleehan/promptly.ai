import {useCallback, useEffect, useState} from "react";
import logo from "/src/assets/icons/logo.svg"
import chatIcon from "/src/assets/icons/chat-icon.svg"

const STORAGE_KEY = 'promptly_chats';

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


const useChats = () => {

    const [updatedChatIcon, setUpdateChatIcon] = useState(logo);
    const [activeChatId, setActiveChatId] = useState(null);
    const [updatedHeaderTitle, setUpdateHeaderTitle] = useState('New Chat');

    // lazy initialization (link to func into useState) to read the localStorage only one time after rendering
    const [chats, setChats] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // saving after changes of [chats]
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
        } catch(error) {
            console.error('Failed to save chats to localStorage:', error);
        }
    }, [chats])

    const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

    async function generateChatTitle(userText, assistantText) {
        try {
            const response = await fetch('/api/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userText, assistantText }),
            });

            if (!response.ok) return null;

            const data = await response.json();
            return data.title ?? null;
        } catch (error) {
            console.error('Failed to generate chat title:', error);
            return null;
        }
    }

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

        const pendingMessageId = crypto.randomUUID();
        const pendingMessage = {
            id: pendingMessageId,
            role: 'assistant',
            text: '',
            timestamp: Date.now(),
            status: 'pending',
        }

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.id === targetChatId
                    ? {...chat, messages: [...chat.messages, pendingMessage] }
                    : chat
            ))

        const messagesForApi = [
            ...(activeChat?.messages ?? [])
                .filter((msg) => msg.status !== 'pending' && msg.status !== 'error')
                .map((msg) => ({
                role: msg.role,
                content: msg.text,
            })),
            {role: 'user', content: trimmedText},
        ];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messagesForApi })
            })
            if(!response.ok) {
                const errorText = await response.text();
                console.error('Server return an error', errorText);


                setChats((prevChats) =>
                    prevChats.map((chat) =>
                        chat.id === targetChatId
                            ? {
                                ...chat,
                                messages: chat.messages.map((msg) =>
                                    msg.id === pendingMessageId
                                        ? {...msg, status: 'error', text: 'Error with fetching answer'}
                                        : msg
                                )
                            }
                            : chat
                    )
                )
                return;
            }

            const data = await response.json();
            const replyText = data.reply;


            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === targetChatId
                        ? {
                            ...chat,
                            messages: chat.messages.map((msg) =>
                                msg.id === pendingMessageId
                                    ? { ...msg, text: replyText, status: 'sent' }
                                    : msg
                            ),
                            updatedAt: Date.now(),
                        }
                        : chat
                )
            );


            if(!activeChat) {
                generateChatTitle(trimmedText, replyText).then((generatedTitle) => {
                    if(!generatedTitle) return;

                    setChats((prevChats) =>
                        prevChats.map((chat) =>
                            chat.id === targetChatId
                                ? {...chat, title: generatedTitle}
                                : chat
                        )
                    )
                    setUpdateHeaderTitle(generatedTitle);
                })
            }
        } catch (error) {
            console.error('Failed to get response from Promptly:', error)

            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === targetChatId
                        ? {
                            ...chat,
                            messages: chat.messages.map((msg) =>
                                msg.id === pendingMessageId
                                    ? { ...msg, status: 'error', text: 'Network error' }
                                    : msg
                            ),
                        }
                        : chat
                )
            );
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
        setUpdateHeaderTitle('New Chat');
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