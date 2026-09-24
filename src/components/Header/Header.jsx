import HeaderTitle from "./HeaderTitle.jsx";
import HeaderButtons from "./HeaderButtons.jsx";

const Header = (props) => {

    const {
        updatedHeaderTitle,
        updatedChatIcon,
        onDeleteChat,
        activeChatId,
        isSidebarOpen,
        onToggleSidebar,
    } = props;


    return (
        <header className="header">
            <HeaderTitle updatedHeaderTitle={updatedHeaderTitle}
                         updatedChatIcon={updatedChatIcon}
                         isSidebarOpen={isSidebarOpen}
                         onToggleSidebar={onToggleSidebar}
            />
            <HeaderButtons onDelete={onDeleteChat} activeChatId={activeChatId}/>
        </header>
    )
}

export default Header;