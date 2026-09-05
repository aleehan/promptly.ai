import SuggestionCard from "./SuggestionCard.jsx";
import {suggestions} from "../../data/suggestions.js";

const WelcomeScreen = (props) => {
    const {
        onSuggestionClick,
    } = props;

    return (
        <main className="chat">
            <h1 className="visually-hidden">The Promptly AI Chat Bot</h1>

            <section className="chat_first_message">
                <div className="chat_first_message_title">
                    <img
                        src="src/assets/icons/chat-icon.svg"
                        alt="The Promptly AI Chat Bot Icon"
                        className="chat_first_message_title_icon"
                        width="48"
                        height="48"
                    />
                    <h1 className="chat_first_message_title_main">How can I help you today?</h1>
                    <p className="chat_first_message_title_text">
                        Describe what you need and Promptly AI will analyze, explain, or plan it for you.
                    </p>
                </div>

                <div className="chat_first_message_suggestions">
                    {suggestions.map((suggest) => (
                        <SuggestionCard
                            key={suggest.id}
                            icon={suggest.icon}
                            title={suggest.title}
                            text={suggest.text}
                            onClick={() => onSuggestionClick(suggest.title)}
                        />
                    ))}
                </div>
            </section>

            <div id="messagesList" className="chat_messages">
                {/* Сюда позже будет рендериться список сообщений через .map() */}
            </div>
        </main>
    )
}

export default WelcomeScreen