import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.jsx";
import MessageList from "./components/Chat/MessageList.jsx";
import useChats from "./hooks/useChats.js";
import Sidebar from "./components/Sidebar/Sidebar.jsx";

const App = () => {

    const { chats, activeChat, activeChatId, sendMessage, updatedHeaderTitle, clearActiveChat, updatedChatIcon, selectChat, deleteChat } = useChats()
    return (
        <div className="app-layout">
            <Sidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={selectChat}
                onNewChat={clearActiveChat}
            />
            <div className="app-main">
                <Header updatedHeaderTitle={updatedHeaderTitle}
                        onDeleteChat={deleteChat}
                        updatedChatIcon={updatedChatIcon}
                        activeChatId={activeChatId}
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