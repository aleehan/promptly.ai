import ChatListItem from './ChatListItem';

const ChatList = ({ chats, activeChatId, onSelectChat }) => {
    const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <div className="sidebar_conversations">
            <div className="sidebar_conversations_label">
                <span>CONVERSATIONS</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>

            <div className="sidebar_conversations_list">
                {sortedChats.map((chat) => (
                    <ChatListItem
                        key={chat.id}
                        title={chat.title || 'Untitled Chat'}
                        subtitle={chat.messages?.[0]?.text ?? ''}
                        updatedAt={chat.updatedAt}
                        isActive={chat.id === activeChatId}
                        onClick={() => onSelectChat(chat.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatList;