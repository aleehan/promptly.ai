const SidebarFooter = ({ isDarkMode, onToggleDarkMode, user, isAuthLoading, onLogin, onRegister, onLogout }) => {
    return (
        <div className="sidebar_footer">
            <button className="sidebar_footer_toggle" onClick={onToggleDarkMode}>
                <span className="sidebar_footer_toggle_label">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    Dark mode
                </span>
                <span className="sidebar_footer_toggle_action">{isDarkMode ? 'On' : 'Switch'}</span>
            </button>

            {isAuthLoading ? null : user ? (
                <div className="sidebar_footer_profile">
                    <div className="sidebar_footer_profile_avatar">
                        {user.email[0].toUpperCase()}
                    </div>
                    <div className="sidebar_footer_profile_info">
                        <span className="sidebar_footer_profile_name">Signed in</span>
                        <span className="sidebar_footer_profile_email">{user.email}</span>
                    </div>
                    <button className="sidebar_footer_logout" onClick={onLogout}>
                        Log out
                    </button>
                </div>
            ) : (
                <div className="sidebar_footer_auth">
                    <button className="sidebar_footer_auth_primary" onClick={onRegister}>
                        Sign up
                    </button>
                    <button className="sidebar_footer_auth_secondary" onClick={onLogin}>
                        Sign in
                    </button>
                </div>
            )}
        </div>
    );
};

export default SidebarFooter;