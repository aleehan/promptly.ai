import { formatRelativeTime } from '../../utils/formatRelativeTime';

const ChatListItem = ({ title, subtitle, updatedAt, isActive, onClick }) => {
    return (
        <button
            className={`sidebar_item ${isActive ? 'sidebar_item--active' : ''}`}
            onClick={onClick}
        >
            <div className="sidebar_item_top">
                <span className="sidebar_item_title">{title}</span>
                <span className="sidebar_item_time">{formatRelativeTime(updatedAt)}</span>
            </div>
            {subtitle && <p className="sidebar_item_subtitle">{subtitle}</p>}
        </button>
    );
};

export default ChatListItem;