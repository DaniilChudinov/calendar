import React, { useRef, useEffect } from 'react';
import { css } from 'emotion';
import { useHistory } from 'react-router-dom';
import RteText from 'components/RteText/RteText';

const Saints = ({ saints, date }) => {
    const ref = useRef(null);
    const history = useHistory();
    useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener('click', ev => {
                const a = ev.target.closest('a');
                if (!a || !ref.current.contains(a)) {
                    return null;
                }
                ev.preventDefault();
                const saintId = a.dataset.saint;
                history.push({
                    pathname: `/date/${date}/saint/${saintId}`,
                    state: { backLink: history.location.pathname },
                });
            });
        }
    }, []);
    return (
        <RteText
            html={saints}
            ref={ref}
            className={css`
                margin-left: 22px;
                margin-bottom: 24px;
                & img {
                    margin-right: 8px;
                    margin-left: -22px;
                }
            `}
        />
    );
};
export default Saints;
