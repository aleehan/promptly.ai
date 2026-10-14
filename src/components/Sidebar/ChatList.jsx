import ChatListItem from './ChatListItem';
import {useState, useRef, useEffect} from "react";

const ChatList = ({ chats, activeChatId, onSelectChat }) => {
    const [query, setQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if(isSearchOpen) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    const closeSearch = () => {
        setQuery('');
        setIsSearchOpen(false);
    };

    const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

    const normalizedQuery = query.trim().toLowerCase();
    const visibleChats = sortedChats.filter((chat) => {
        return (chat.title || '').toLowerCase().includes(normalizedQuery)
    })

    return (
        <div className="sidebar_conversations">
            <div className="sidebar_conversations_label">
                {
                    isSearchOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="sidebar_search_input"
                            placeholder="Search chats..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') closeSearch();
                            }}
                            onBlur={() => {
                                if (!query) setIsSearchOpen(false);
                            }}
                        />
                    ) : (
                        <span>CONVERSATIONS</span>
                    )
                }
                <button
                    type="button"
                    className="sidebar_search_toggle"
                    onClick={() => setIsSearchOpen((prev) => !prev)}
                    aria-label={isSearchOpen ? 'Close search' : 'Search chats'}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                        <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>
            </div>

            <div className="sidebar_conversations_list">
                {visibleChats.length === 0 && normalizedQuery ? (
                    <p className="sidebar_no_results">No chats found</p>
                ) : (
                    visibleChats.map((chat) => (
                            <ChatListItem
                                key={chat.id}
                                title={chat.title || 'Untitled Chat'}
                                subtitle={chat.messages?.[0]?.text ?? ''}
                                updatedAt={chat.updatedAt}
                                isActive={chat.id === activeChatId}
                                onClick={() => onSelectChat(chat.id)}
                            />
                        ))
                )}
            </div>
        </div>
    );
};

export default ChatList;