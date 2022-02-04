import { Box } from '@mui/system';
import Grid from '@mui/material/Grid';
import {  FC, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
    SelectChangeEvent,
    Chip,
    Theme,
} from '@mui/material';
import Typography from '../../atoms/Typography';
import { Copyright } from '../../atoms/Copyright';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../../atoms/Select';
import i18next from 'i18next';
 
export interface FooterProps {
    selectedTheme?: string;
    theme?: Theme;
}

const StyledBox = styled(Box)<{ theme?: Theme }>`
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 10rem;
    height: 100%;
    padding: 2rem 0 1rem;
    justify-content: space-between;
    margin-top: -0.2rem;
    color: ${(props) => props.theme.palette.text.primary};

    background-color: ${(props) => props.theme.palette.background.default};

    position: sticky;
    top: 0;
    z-index: 1;
    transition: padding-left 0.2s, padding-right 0.2s;
    padding: 3rem 3rem 1rem;

    box-shadow: ${(props) => props.theme.boxShadow.default};

    @media (max-width: 900px) {
        padding-left: 1.5rem;
        padding-right: 1rem !important;
        transition: padding-left 0.2s, padding-right 0.2s;
    }
`;

const LinkStyled = styled(Link)`
    display: block;    
    height: 2.5rem;
    max-width: max-content;
    transition: 0.2s;
    align-items: center;
`;

 

const LogoStyled = styled.img<{ theme?: Theme }>`
    filter: ${(props) => props.theme.logo.filter ?? 'invert(0%)'};
    display: block;
    height: 1rem;
    transition: height 0.2s;

    @media (max-width: 600px) {
        height: 0.9rem;
        transition: height 0.2s;
    }
`;

const SocialStyled = styled.img<{ theme?: Theme }>`
    filter: ${(props) => props.theme.logo.filter ?? 'invert(0%)'};
    height: 1.6rem;
`;

const iconStyle = {
    width: 25,
    height: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    mr: 1,
};

const StyledLink = styled(Link)<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.text.primary};
    text-decoration: none;
    font-family: 'Poppins Medium' !important;
    font-size: 0.8rem;

    @media (max-width: 1100px) {
        height: 2rem;
    }
`;

export const Footer: FC<FooterProps> = () => {
    const { t } = useTranslation(['translation']);

    const [selectedLanguage, setSelectedLanguage] = useState<string>(
        i18next.language,
    );

    return (
        <StyledBox>
            <Grid
                item
                xs={12}
                md={4}
                lg={6}
                sx={{
                    display: 'flex',
                    height: '8rem',
                    flexDirection: 'column',
                }}
            >
                <LinkStyled to="/">
                    <LogoStyled alt="Logo" src={'/img/Logo.svg'} />
                </LinkStyled>

                <Typography
                    size="body"
                    weight="Light"
                    sx={{
                        marginTop: '1.5rem',
                        fontSize: '.7rem',
                        alignSelf: 'start',
                        marginBottom: '1rem',
                        maxWidth: '11rem',
                    }}
                >
                    {t('home.hero.description_1')}
                </Typography>
                <Box sx={{ marginTop: '.5rem' }}>
                    <Copyright />
                </Box>
            </Grid>

            <Grid
                container
                md={7}
                lg={6}
                columnSpacing={{ xs: 0, sm: 2, md: 3 }}
                sx={{
                    marginLeft: 'auto',
                }}
            >
                <Grid item xs={6} md={3}>
                    <Typography
                        size="h5"
                        weight="SemiBold"
                        gutterBottom
                        sx={{ marginTop: '1rem' }}
                    >
                        {t('footer.headline_1.title')}
                    </Typography>

                    <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/home">
                                {t('footer.headline_1.link_2')}
                            </StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/store">
                                {t('footer.headline_1.link_1')}
                            </StyledLink>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography
                        size="h5"
                        weight="SemiBold"
                        gutterBottom
                        sx={{ marginTop: '1rem' }}
                    >
                        {t('footer.headline_2.title')}
                    </Typography>

                    <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/vision">
                                {t('footer.headline_2.link_1')}
                            </StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/privacy">
                                {t('footer.headline_2.link_2')}
                            </StyledLink>
                        </Box>
                    </Box>
                </Grid>

                <Grid
                    item
                    xs={6}
                    md={3}
                    sx={{ height: '7rem', marginTop: '1rem' }}
                >
                    <Typography weight="SemiBold" size="h5" gutterBottom>
                        {t('footer.headline_3.title')}
                    </Typography>

                    <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/terms">
                                {t('footer.headline_3.link_1')}
                            </StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/privacy">
                                {t('footer.headline_3.link_2')}
                            </StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/faq">
                                {t('footer.headline_3.link_3')}
                            </StyledLink>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={6} md={3} sx={{ marginTop: '1rem' }}>
                    <Typography weight="SemiBold" size="h5" gutterBottom>
                        {t('footer.headline_4.title')}
                    </Typography>

                    <Box
                        component="ul"
                        sx={{
                            display: 'flex',
                            paddingLeft: '0',
                            margin: '.5rem 0 1.5rem',
                        }}
                    >
                        <Box
                            component="a"
                            target="_blank"
                            href="https://www.linkedin.com/company/tzconnect/"
                            sx={iconStyle}
                        >
                           <SocialStyled
                                src={'/img/linkedin.svg'}
                                alt="Linkedin"
                            />
                        </Box>
                        <Box
                            component="a"
                            target="_blank"
                            href="https://twitter.com/TZConnectBerlin"
                            sx={iconStyle}
                        >
                            <SocialStyled
                                src={'/img/twitter.svg'}
                                alt="Twitter"
                            />
                        </Box>
                        <Box
                            component="a"
                            target="_blank"
                            href="https://www.tzconnect.com/en/"
                            sx={iconStyle}
                        >
                            <SocialStyled src={'/img/tezos.svg'} alt="TZ connect" />
                        </Box>
                    </Box>

                    <Typography weight="SemiBold" size="h5" gutterBottom>
                        {t('footer.headline_5.title')}
                    </Typography>

                    <CustomSelect
                        id="Language selection - footer"
                        availableOptions={[
                            {
                                value: 'en',
                                label: 'English',
                            },
                            {
                                value: 'fr',
                                label: 'Français',
                            },
                            {
                                value: 'de',
                                label: 'Deutsch',
                            },
                            {
                                value: 'ab',
                                label: 'عرب',
                            },
                        ]}
                        selectedOption={selectedLanguage ?? 'en'}
                        triggerFunction={(event: SelectChangeEvent) => {
                            setSelectedLanguage(event.target.value);
                            i18next.changeLanguage(event.target.value);
                        }}
                        disabled={false}
                        customSize="small"
                    />
                </Grid>
            </Grid>
        </StyledBox>
    );
};
