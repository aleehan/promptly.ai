import {useEffect, useState, useCallback} from "react";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.jsx";
import MessageList from "./components/Chat/MessageList.jsx";
import useChats from "./hooks/useChats.js";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import useMediaQuery from "./hooks/useMediaQuery.js";
import useAuth from "./hooks/useAuth.js";
import AuthModal from './components/Auth/AuthModal';


const App = () => {

    const { user, isLoading, error, login, logout, register, clearError } = useAuth();
    const [authModal, setAuthModal] = useState(null);

    const openAuth = useCallback((mode) => {
        clearError();
        setAuthModal(mode);
    }, [clearError]);

    const closeAuth = useCallback(() => setAuthModal(null), []);

    const {
        chats, activeChat, activeChatId, sendMessage, updatedHeaderTitle,
        clearActiveChat, updatedChatIcon, selectChat, deleteChat,
    } = useChats({
        onLimitReached: () => openAuth('register'),
        userId: user?.id ?? null,
    });


    const [isSidebarOpen, setIsSidebarOpen] = useState(() => !window.matchMedia('(max-width: 768px)').matches);
    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    const closeSidebarOnMobile = () => {
        if (isMobile) setIsSidebarOpen(false);
    };

    const handleSelectChat = (id) => {
        selectChat(id);
        closeSidebarOnMobile();
    };

    const handleNewChat = () => {
        clearActiveChat();
        closeSidebarOnMobile();
    };

    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            return localStorage.getItem('promptly_theme') === 'dark';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        try {
            localStorage.setItem('promptly_theme', isDarkMode ? 'dark' : 'light');
        } catch (error) {
            console.log('Failed to set theme: ', error);
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

    return (
        <div className="app-layout">
            <Sidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                user={user}
                isAuthLoading={isLoading}
                onLogin={() => openAuth('login')}
                onRegister={() => openAuth('register')}
                onLogout={logout}
            />
            {isMobile && isSidebarOpen && (
                <div className="sidebar-backdrop" onClick={toggleSidebar} />
            )}
            <div className="app-main">
                <Header updatedHeaderTitle={updatedHeaderTitle}
                        onDeleteChat={deleteChat}
                        updatedChatIcon={updatedChatIcon}
                        activeChatId={activeChatId}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={toggleSidebar}
                />

                {activeChat ? (
                    <MessageList messages={activeChat.messages} />
                ) : (
                    <WelcomeScreen onSuggestionClick={sendMessage} />
                )}

                <Footer onSend={sendMessage} />
            </div>
            {authModal && (
                <AuthModal
                    mode={authModal}
                    error={error}
                    onSubmit={authModal === 'login' ? login : register}
                    onSwitchMode={() => openAuth(authModal === 'login' ? 'register' : 'login')}
                    onClose={closeAuth}
                />
            )}
        </div>

    )
}

export default App