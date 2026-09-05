import Message from "./Message.jsx";

const MessageList = (props) => {
    const {
        messages,
    } = props;

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
        </div>
    )
}

export default MessageList;