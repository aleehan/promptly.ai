import chooseModelIcon from "../../assets/icons/model_button_more.svg"
import ClearChatIcon from "../../assets/icons/button_clear.svg"
import learnMoreIcon from "../../assets/icons/more.svg"

const HeaderButtons = (props) => {
    const {
        onClear,
    } = props;

    return (
        <div className="header-buttons">
            <button className="header-buttons_model button">
                <span className="header-buttons_model_active"></span>
                Promptly Model v2.4
                <img src={chooseModelIcon} alt="Choose the model"
                     className="header-buttons_model_more"/>
            </button>
            <button className="header-buttons_clear button" onClick={onClear}>
                <img src={ClearChatIcon} alt="Clear the chat"
                     className="header-buttons_clear_icon"/>
                Clear
            </button>
            <button className="header-buttons_more button">
                <img src={learnMoreIcon} alt="More" width="18" height="18"/>
            </button>
        </div>
    )
}

export default HeaderButtons;