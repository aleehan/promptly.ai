import logo from "../../assets/icons/logo.svg"

const HeaderTitle = () => {
    return (
        <div className="header-content">
            <div className="header-content_logo">
                <img src={logo} alt="Promptly Logo" width="32" height="32"/>
            </div>
            <div className="header-content_title">
                <h3 className="header-content_title_main">New Chat</h3>
                <p className="header-content_title_text">Ask Promptly AI anything about your finances.</p>
            </div>
        </div>
    )
}

export default HeaderTitle;