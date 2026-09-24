import logo from "../../assets/icons/logo.svg"

const HeaderTitle = (props) => {
    const {
        updatedHeaderTitle,
        updatedChatIcon,
        isSidebarOpen,
        onToggleSidebar,
    } = props;

    return (
        <div className="header-content">
            <button
                className={`header_toggle-sidebar ${!isSidebarOpen ? 'header_toggle-sidebar--hidden' : ''}`}
                onClick={onToggleSidebar}
                aria-label="Open sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
                    <path
                        d="M177 27.1c-90.9 4-135.1 40.3-147.6 121.4-1.8 11.1-1.9 19.5-1.9 107.5 0 105.3-.1 103.8 6.5 130.3 16 63.9 61 95 142.8 98.5 8.5.4 51.7.4 96 .1 87.4-.6 88.2-.6 112.1-6.5 52.9-13 83.7-45.6 95-100.4 4.9-23.4 5.2-32.4 4.8-129.3-.4-98.9-.3-97-6.7-122.9-12.3-49.5-43.1-80-93-92.2-23.6-5.7-26.3-5.9-95.5-6.3-35.2-.2-71.6-.4-81-.6-9.3-.1-23.5.1-31.5.4zm-1 229v197.1l-7.7-.6c-38.9-3.4-62.3-11.9-79.6-29.2-14.8-14.8-23.9-36.1-27.9-65.3-1.9-13.9-1.9-190.3 0-204.2 7-51.2 29.4-78.4 74-89.4 5.2-1.3 13.5-2.9 18.6-3.4 5-.6 10.5-1.3 12.1-1.5 1.7-.1 4.7-.4 6.8-.5l3.7-.1V256.1zm186.5-194.8c49.8 8.8 74.3 30 85 73.5 4.9 19.5 5 22.7 5 122.2 0 100.7 0 101.2-5.4 122.2-9.4 36.6-31.3 58.5-67.9 67.9-19.9 5.1-22.1 5.2-98.9 5.6l-72.3.4V256.1 58.9l72.8.4c60.6.4 74.2.7 81.7 2z"/>
                </svg>
            </button>
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