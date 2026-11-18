import FooterChatInput from "./FooterChatInput.jsx";
import FooterInputHint from "./FooterInputHint.jsx";

const Footer = (props) => {
    const {
        onSend,
        isGenerating,
        onStop,
    } = props;

    return (
        <footer className="footer-input">
            <form className="footer-input_chat" id="footer-input_chat_main">
                <FooterChatInput
                    onSend={onSend}
                    isGenerating={isGenerating}
                    onStop={onStop}
                />
                <FooterInputHint></FooterInputHint>
            </form>
        </footer>
    )
}

export default Footer;