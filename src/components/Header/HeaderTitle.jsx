import logo from "../../assets/icons/logo.svg"

const HeaderTitle = (props) => {
    const {
        updatedHeaderTitle,
        updatedChatIcon
    } = props;

    return (
        <div className="header-content">
            <div className="header-content_logo">
                <img src={updatedChatIcon} alt="Promptly Logo" width="32" height="32"/>
            </div>
            <div className="header-content_title">
                <h3 className="header-content_title_main">{updatedHeaderTitle}</h3>
                <p className="header-content_title_text">Ask Promptly AI anything about your finances.</p>
            </div>
        </div>
    )
}

export default HeaderTitle;