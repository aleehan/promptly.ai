import FooterChatInput from "./FooterChatInput.jsx";
import FooterInputHint from "./FooterInputHint.jsx";

const Footer = () => {
    return (
        <footer className="footer-input">
            <form className="footer-input_chat" id="footer-input_chat_main">
                <FooterChatInput></FooterChatInput>
                <FooterInputHint></FooterInputHint>
            </form>
        </footer>
    )
}

export default Footer;