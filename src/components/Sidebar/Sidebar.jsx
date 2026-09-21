import ChatList from './ChatList';
import SidebarFooter from './SidebarFooter';

const Sidebar = ({ chats, activeChatId, onSelectChat, onNewChat }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar_brand">
                <div className="sidebar_brand_logo">
                    <img src="/src/assets/icons/sidebar/main_logo.svg" alt="Promptly Logo" width="40" height="40"/>
                </div>
                <span className="sidebar_brand_title">Promptly</span>
            </div>

            <button className="sidebar_new_chat button" onClick={onNewChat}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Chat
            </button>

            <ChatList
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={onSelectChat}
            />

            <SidebarFooter />
        </aside>
    );
};

export default Sidebar;