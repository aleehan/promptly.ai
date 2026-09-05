
const SuggestionCard = (props) => {
    const {
        icon,
        title,
        text,
        onClick,
    } = props

    return (
            <button className="chat_first_message_suggestions_item suggestions_button" onClick={onClick}>
                <img
                    src={icon}
                    alt={title}
                    className="chat_first_message_suggestions_item_img"
                    width="28"
                    height="28"
                />
                <h3 className="chat_first_message_suggestions_item_main">{title}</h3>
                <p className="chat_first_message_suggestions_item_text">
                    {text}
                </p>
            </button>
    )
}

export default SuggestionCard