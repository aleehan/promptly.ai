import { useState, useEffect } from 'react';

const AuthModal = ({ mode, error, onSubmit, onSwitchMode, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLogin = mode === 'login';

    // Закрытие по Escape
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await onSubmit(email, password);
        setIsSubmitting(false);
        if (success) onClose();
    };

    return (
        <div className="auth-backdrop" onClick={onClose}>
            <div
                className="auth-modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="auth-modal_title">
                    {isLogin ? 'Sign in' : 'Create account'}
                </h2>
                <p className="auth-modal_subtitle">
                    {isLogin
                        ? 'Welcome back to Promptly.'
                        : 'Sign up to get more requests and keep your history.'}
                </p>

                <form className="auth-modal_form" onSubmit={handleSubmit}>
                    <input
                        className="auth-modal_input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        autoFocus
                    />
                    <input
                        className="auth-modal_input"
                        type="password"
                        placeholder="Password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        minLength={8}
                        maxLength={128}
                        required
                    />

                    {error && <p className="auth-modal_error">{error}</p>}

                    <button
                        className="auth-modal_submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Sign up'}
                    </button>
                </form>

                <button
                    className="auth-modal_switch"
                    type="button"
                    onClick={onSwitchMode}
                >
                    {isLogin ? 'No account? Sign up' : 'Have an account? Sign in'}
                </button>
            </div>
        </div>
    );
};

export default AuthModal;