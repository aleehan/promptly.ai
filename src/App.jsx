import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.jsx";
import MessageList from "./components/Chat/MessageList.jsx";
import useChats from "./hooks/useChats.js";

const App = () => {

    const { activeChat, sendMessage, updatedHeaderTitle, clearActiveChat, updatedChatIcon } = useChats()
    return (
        <>
            <Header updatedHeaderTitle={updatedHeaderTitle} clearActiveChat={clearActiveChat} updatedChatIcon={updatedChatIcon}/>

            {activeChat ? (
                <MessageList messages={activeChat.messages} />
            ) : (
                <WelcomeScreen onSuggestionClick={sendMessage} />
            )}

            <Footer onSend={sendMessage} />
        </>
    )
}

export default App