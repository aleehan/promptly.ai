import HeaderTitle from "./HeaderTitle.jsx";
import HeaderButtons from "./HeaderButtons.jsx";

const Header = (props) => {

    const {
        updatedHeaderTitle,
        clearActiveChat,
        updatedChatIcon,
    } = props;


    return (
        <header className="header">
            <HeaderTitle updatedHeaderTitle={updatedHeaderTitle} updatedChatIcon={updatedChatIcon} />
            <HeaderButtons onClear={clearActiveChat}/>
        </header>
    )
}

export default Header;