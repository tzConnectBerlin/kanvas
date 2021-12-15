import * as React from 'react';
import styled from '@emotion/styled';
import { Grid, Paper, Stack, useMediaQuery, useTheme } from '@mui/material';
import { CustomButton } from '../../atoms/Button';
import { Typography } from '../../atoms/Typography';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Theme } from '@mui/material';
import FlexSpacer from '../../atoms/FlexSpacer';
import ProfilePopoverStories from '../ProfilePopover/ProfilePopover.stories';

interface StyledPaperProps {
    backgroundColor?: string;
    theme?: Theme;
}

export interface CookiesBannerProps {
    theme?: Theme;
    /**
     * Title for the Cookies
     */
    title?: string;
    /**
     * text for the banner
     */
    text?: string;
    /**
     * checkboxes for the cookies
     */
    standard?: { [name: string]: boolean };
    /**
     * the fields used to generate the checkbox options
     */
    handleClose?: (title: string) => void | Promise<void>;
}

const StyledLink = styled(Link) <{ theme?: Theme }>`
    color: inherit;
    text-decoration: none;
    font-family: inherit;
    display: inline;
    text-decoration: underline;
`;
const StyledPaper = styled(Paper) <StyledPaperProps>`
    background-color: ${propos => propos.theme.palette.background.paper};
    border-radius: 0 !important;
    color: #fff;
    position: sticky;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 0 -4px 6px -2px rgba(9, 9, 9, 0.2);
`;

const StyledStack = styled(Stack)`

    justify-content: center !important;
    align-items: center !important;
    padding: 2.5rem;
`

const defaultCookies = {
    necessary: true,
    preferences: false,
    statistics: false,
    marketing: false,
};

const StyledBackgroundDiv = styled.div<{theme?: Theme}>`
    z-index: 30;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    position: absolute;
    overflow-x: hidden;
    overflow-y: hidden;
    opacity: 0.75;
    background-color: ${props => props.theme.palette.background.default };
`

export const CookiesBanner: React.FC<CookiesBannerProps> = ({
    title = 'Privacy Policy',
    standard = defaultCookies,
    handleClose,
}) => {
    const theme = useTheme();
    const { t } = useTranslation(['translation']);

    const { primary } = theme.palette;
    const isMobile = useMediaQuery('(max-width:874px)');
    const isDesktop = useMediaQuery('(min-width:1150px)');
    const [cookie, setCookie] = React.useState(standard);
    const addCookie = (cookies: { [name: string]: boolean }) => {
        document.cookie = `user=${JSON.stringify(cookies)}; max-age=8640000;}`;
    };

    React.useEffect(()  => {
        document.body.style.overflow = 'hidden';
    }, [])

    const handleSubmit = () => {
        document.body.style.overflow = '';
        addCookie(cookie);
        handleClose && handleClose(title);
    };

    return (
        <>
            <StyledBackgroundDiv></StyledBackgroundDiv>
            <StyledPaper elevation={0} backgroundColor={primary.main}>
                <StyledStack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Typography
                        width={isMobile ? '90%' : '45%'}
                        size='body2'
                        weight="Light"
                        display="inline"
                        style={{
                            alignSelf: 'center',
                            marginBottom: !isDesktop ? '2rem' : 0,
                            marginRight: isDesktop ? 'auto' : '2rem',
                        }}
                    >
                        {t('cookies.text')}
                        <StyledLink to="/privacy">
                            {t('cookies.link')}
                        </StyledLink>
                        {' .'}
                    </Typography>
                    <CustomButton
                        size='small'
                        onClick={handleSubmit}
                        label={t('cookies.button')}
                    />
                </StyledStack>
            </StyledPaper>
        </>
    );
};
