import HeaderTitle from "./HeaderTitle.jsx";
import HeaderButtons from "./HeaderButtons.jsx";

const Header = (props) => {

    const {
        updatedHeaderTitle,
        updatedChatIcon,
        onDeleteChat,
        activeChatId,
    } = props;


    return (
        <header className="header">
            <HeaderTitle updatedHeaderTitle={updatedHeaderTitle} updatedChatIcon={updatedChatIcon} />
            <HeaderButtons onDelete={onDeleteChat} activeChatId={activeChatId}/>
        </header>
    )
}

export default Header;