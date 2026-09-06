import FooterChatInput from "./FooterChatInput.jsx";
import FooterInputHint from "./FooterInputHint.jsx";

const Footer = (props) => {
    const {
        onSend,
    } = props;

    return (
        <footer className="footer-input">
            <form className="footer-input_chat" id="footer-input_chat_main">
                <FooterChatInput onSend={onSend}></FooterChatInput>
                <FooterInputHint></FooterInputHint>
            </form>
        </footer>
    )
}

export default Footer;