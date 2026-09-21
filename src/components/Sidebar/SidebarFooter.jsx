const SidebarFooter = () => {
    return (
        <div className="sidebar_footer">
            <button className="sidebar_footer_toggle">
                <span className="sidebar_footer_toggle_label">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    Dark mode
                </span>
                <span className="sidebar_footer_toggle_action">Switch</span>
            </button>

            <div className="sidebar_footer_profile">
                <div className="sidebar_footer_profile_avatar" />
                <div className="sidebar_footer_profile_info">
                    <span className="sidebar_footer_profile_name">Johnson Doe</span>
                    <span className="sidebar_footer_profile_email">johnson@Promptly.app</span>
                </div>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>
    );
};

export default SidebarFooter;