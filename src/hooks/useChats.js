import {useCallback, useEffect, useState} from "react";
import logo from "/src/assets/icons/logo.svg"
import chatIcon from "/src/assets/icons/chat-icon.svg"



const STORAGE_KEY = 'promptly_chats';

const FAKE_RESPONSES = [
    'Great question! Let me explain it clearly',

    'Hello! I am doing well, thank you for asking. How can I help you today?If you have a specific task in mind, ' +
    'let me know if you would like to:Generate more text (like stories, essays, or placeholder text)Brainstorm ideas ' +
    'for a projectSolve a problem or analyze some dataHow would you like to proceed?',

    'The ancient clock struck thirteen, echoing softly through the hollow corridors of the abandoned observatory. ' +
    'Outside, a gentle mist rolled over the jagged peaks of the obsidian mountains, turning the pine trees into vague, ' +
    'ghostly silhouettes. Blue lanterns flickered along the winding cobblestone path where no traveler had walked for ' +
    'decades. A solitary mechanical owl perched upon the rusted iron gate, its brass gears clicking in a slow, rhythmic ' +
    'cadence that matched the distant murmur of the tide against the cliffs. Within this quiet isolation, fragments of ' +
    'forgotten blueprints and dust-covered star charts lay scattered across mahogany desks, waiting patiently for a dawn ' +
    'that seemed perpetually delayed by the creeping violet twilight.',
];

function getFakeAssistantReply() {
    const randomIndex = Math.floor(Math.random() * FAKE_RESPONSES.length);
    return FAKE_RESPONSES[randomIndex];
}

const useChats = () => {
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
    const [updatedChatIcon, setUpdateChatIcon] = useState(logo);

    const sendMessage = useCallback((text) => {
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

        setTimeout(() => {
            const assistantMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: getFakeAssistantReply(),
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
        }, 1200)
    }, [activeChatId])

    const clearActiveChat = useCallback(() => {
        setActiveChatId(null);
        setUpdateHeaderTitle('New Chat');
    }, []);

    return {
        chats,
        activeChat,
        activeChatId,
        sendMessage,
        setActiveChatId,
        clearActiveChat,
        updatedHeaderTitle,
        updatedChatIcon,
    };
}

export default useChats;