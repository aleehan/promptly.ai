import {useState, useEffect, useCallback} from 'react';

async function request(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
}

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch('/api/me');
                if(response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setIsLoading(false);
            }
        }

        checkSession();
    }, []);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const { ok, data } = await request('/api/login', {email, password});

            if(!ok) {
                setError(data.error ?? 'Something went wrong');
                return false;
            }

            setUser(data.user);
            return true;
        } catch {
            setError('Network error');
            return false;
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await request('/api/logout');
        } catch {

        }
        setUser(null);
    }, [])

    const register = useCallback(async (email, password) => {
        setError(null);
        try {
            const { ok, data } = await request('/api/register', {email, password});

            if(!ok) {
                setError(data.error ?? 'Something went wrong');
                return false;
            }
            return await login(email, password);
        } catch {
            setError('Network error');
            return false;
        }
    }, [login])

    const clearError = useCallback(() => setError(null), []);

    return { user, isLoading, error, login, logout, register, clearError };
};

export default useAuth;