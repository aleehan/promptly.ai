import {useState} from "react";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.jsx";
import MessageList from "./components/Chat/MessageList.jsx";
import useChats from "./hooks/useChats.js";
import Sidebar from "./components/Sidebar/Sidebar.jsx";


const App = () => {

    const { chats, activeChat, activeChatId, sendMessage, updatedHeaderTitle, clearActiveChat, updatedChatIcon, selectChat, deleteChat } = useChats()

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    return (
        <div className="app-layout">
            <Sidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={selectChat}
                onNewChat={clearActiveChat}
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
            />
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
        </div>

    )
}

export default App