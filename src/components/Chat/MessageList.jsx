import Message from "./Message.jsx";
import {useEffect, useRef} from "react";

const MessageList = (props) => {
    const {
        messages,
    } = props;

    const bottomRef = useRef(null);

    const last = messages[messages.length - 1];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: last?.status === 'streaming' ? 'auto' : 'smooth' });
    }, [messages.length, last?.text]);

    return (
        <div id="messagesList" className="chat_messages">
            {messages.map((msg) => (
                <Message
                    key={msg.id}
                    {...msg}
                />
            ))}
            <div ref={bottomRef}/>
        </div>
    )
}

export default MessageList;