import Message from "./Message.jsx";
import {useEffect, useRef} from "react";

const MessageList = (props) => {
    const {
        messages,
    } = props;

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length])

    return (
        <div id="messagesList" className="chat_messages">
            {messages.map((msg) => (
                <Message
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    timestamp={msg.timestamp}
                />
            ))}
            <div ref={bottomRef}/>
        </div>
    )
}

export default MessageList;