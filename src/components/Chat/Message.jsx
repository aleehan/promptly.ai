const Message = (props) => {
    const {
        role,
        text,
        timestamp,
    } = props;

    const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="message" data-role={role}>
            <div className="message-bubble">
                <div className="message-bubble_content">{text}</div>
            </div>
            {role === 'user' && (
                <span className="message-bubble_timestamp">{time}</span>
            )}
        </div>
    )
}

export default Message