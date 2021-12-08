import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router';

const ScrollToTop = ({ ...props }) => {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname !== '/store') {
            window.scrollTo(0, 0);
        }
    }, [location]);

    return <>{props.children}</>;
};

export default ScrollToTop;
