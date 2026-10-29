import { useState, useEffect } from 'react';

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = (e) => setMatches(e.matches);

        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange); // cleanup
    }, [query]);

    return matches;
};

export default useMediaQuery;