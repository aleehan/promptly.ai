import {useState} from "react";
import useAutoResizeTextarea from "/src/hooks/useAutoResizeTextarea.js"

const FooterChatInput = (props) => {
    const {
        onSend,
        isGenerating,
        onStop,
    } = props;

    const [inputText, setInputText] = useState('');
    const textareaRef = useAutoResizeTextarea(inputText)

    // Только для разработки: http://localhost:5173/?stop показывает кнопку Stop без запроса
    const forceStop = import.meta.env.DEV && new URLSearchParams(window.location.search).has('stop');
    const showStop = isGenerating || forceStop;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isGenerating) return;              // во время генерации не отправляем
        if(!inputText.trim()) return;
        onSend(inputText);
        setInputText('');
    }

    return (
        <div className="footer-input_chat_main">
            <button className="footer-input_chat_main_pin button-input" type="button">
                <img
                    src="src/assets/icons/input/pin.svg"
                    alt="Pin Icon"
                    className="footer-input_chat_main_pin_icon"
                    width="28"
                    height="28"
                />
            </button>

            <textarea
                ref={textareaRef}
                name="user_request"
                id="footer-input_chat_main_text"
                rows="1"
                placeholder="Message AI..."
                className="footer-input_chat_main_text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        handleSubmit(e);
                    }
                }}
            ></textarea>

            <div className="footer-input_chat_main_voice_and_send">
                <button className="footer-input_chat_main_voice button-input" type="button">
                    <img
                        src="src/assets/icons/input/mic.svg"
                        alt="Mic Icon"
                        className="footer-input_chat_main_voice_icon"
                        width="28"
                        height="28"
                    />
                </button>

                {showStop ? (
                    <button
                        key="stop"
                        className="footer-input_chat_main_stop"
                        type="button"
                        onClick={onStop}
                        aria-label="Stop generation"
                    >
                        <span className="footer-input_chat_main_stop_square"/>
                    </button>
                ) : (
                    <button
                        key="send"
                        className="footer-input_chat_main_send button-input"
                        type="submit"
                        onClick={handleSubmit}
                    >
                        <img
                            src="src/assets/icons/input/send.svg"
                            alt="Send"
                            className="footer-input_chat_main_send_icon"
                            width="32"
                            height="32"
                        />
                    </button>
                )}
            </div>
        </div>
    )
}

export default FooterChatInput