import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.jsx";
import {useCallback, useState} from "react";
import MessageList from "./components/Chat/MessageList.jsx";

const App = () => {

    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);

    const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

    const handleSendMessage = useCallback((text) => {
        console.log('click fired', activeChatId)
        const trimmedText = text.trim();
        if(!trimmedText) return;

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: trimmedText,
            timestamp: Date.now(),
        }

        if(!activeChat) {
            const newChat = {
                id: crypto.randomUUID(),
                title: trimmedText.slice(0, 40),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: [userMessage],
            };
            setChats((prevChats) => [newChat, ...prevChats]);
            setActiveChatId(newChat.id);
        } else {
            setChats((prevChats) =>
                prevChats.map((chat) =>
                chat.id === activeChatId
                    ? {...chat, messages: [...chat.messages, userMessage], updatedAt: Date.now()}
                    : chat
            ))
        }
    }, [activeChatId]);

  return (
      <>
        <Header />

          {activeChat ? (
              <MessageList messages={activeChat.messages} />
          ) : (
              <WelcomeScreen onSuggestionClick={handleSendMessage} />
          )}

        <Footer onSend={handleSendMessage} />
      </>
  )
}

export default App