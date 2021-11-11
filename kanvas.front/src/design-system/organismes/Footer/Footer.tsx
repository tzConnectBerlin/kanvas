import { Box } from '@mui/system';
import Grid from '@mui/material/Grid';
import { FC } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
    Stack,
    Theme,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import Typography from '../../atoms/Typography';
import { Copyright } from '../../atoms/Copyright';
import { useTranslation } from 'react-i18next';
import { lightTheme as theme } from '../../../theme';

export interface FooterProps {
    selectedTheme?: string;
    theme?: Theme;
}

const StyledBox = styled(Box) <{ theme?: Theme }>`
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 10rem;
    height: 100%;
    padding: 2rem 0 1rem;
    justify-content: space-between;
    margin-top: -.2rem;
    color: ${props => props.theme.palette.text.primary};

    background-color: ${props => props.theme.footer.background};

    position: sticky;
    top: 0;
    z-index: 10;
    transition: padding-left 0.2s, padding-right 0.2s;
    padding:  3rem 3rem 1rem;

    @media (max-width: 900px) {
        padding-left: 1.5rem;
        padding-right: 1rem !important;
        transition: padding-left 0.2s, padding-right 0.2s;
    }
`
const LinkStyled = styled(Link)`
    display: block;
    transition: 0.2s;
    width: 100%;
    height: 2.5rem;
    align-items: center;
`

const LogoStyled = styled.img<{ theme?: Theme }>`
    filter: ${props => props.theme.logo.filter ?? 'invert(0%)'};
    display: block;
    height: 1.8rem;
    transition: height 0.2s;

    @media (max-width: 650px) {
        height: 1.8rem;
        transition: height 0.2s;
    }
`

const FacebookStyled = styled.img<{ theme?: Theme }>`
    filter: ${props => props.theme.logo.filter ?? 'invert(0%)'};
    height: 1.6rem;
`
const TwitterStyled = styled.img<{ theme?: Theme }>`
    filter: ${props => props.theme.logo.filter ?? 'invert(0%)'};
    height: 1.6rem;
`
const iconStyle = {
    width: 25,
    height: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    mr: 1
};

const StyledLink = styled(Link) <{ theme?: Theme }>`
  color: ${props => props.theme.palette.text.primary};
  text-decoration: none;
  font-family: 'Poppins Medium' !important;
  font-size: .8rem;

  @media (max-width: 1100px) {
      height: 2rem;
  }
`


export const Footer: FC<FooterProps> = () => {
    const { t } = useTranslation(['translation']);

    return (
        <StyledBox >
            <Grid item xs={12} md={4} lg={6} sx={{
                display: 'flex',
                height: '8rem',
                flexDirection: 'column',
            }}>
                <LinkStyled to='/'>
                    <LogoStyled alt='Logo' src={'/img/Logo.svg'} />
                </LinkStyled>

                <Typography size='body' weight='Light' sx={{
                    marginTop: '1rem', fontSize: '.7rem', alignSelf: 'start',
                    marginBottom: '1rem'
                }}>TODO: Some text here</Typography>
            </Grid>

            <Grid container md={7} lg={6} sx={{
                marginLeft: 'auto',
            }}>
                <Grid item xs={6} md={3}>
                    <Typography size="h5" weight="SemiBold" gutterBottom>
                        {t('footer.headline_1')}
                    </Typography>

                    <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/store/">Store</StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/product/">Product</StyledLink>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography size="h5" weight="SemiBold" gutterBottom>
                        {t('footer.headline_2')}
                    </Typography>

                    <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/vision/">Vision</StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/privacy/">NFT history</StyledLink>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={6} md={3} sx={{ height: '7rem', marginTop: '1rem' }}>
                    <Typography weight="SemiBold" size="h5" gutterBottom>
                        {t('footer.headline_3')}
                    </Typography>

                    <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/terms/">Terms</StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/privacy/">Privacy</StyledLink>
                        </Box>
                        <Box component="li" sx={{ py: 0.5 }}>
                            <StyledLink to="/faq/">F.A.Q</StyledLink>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={6} md={3} sx={{ marginTop: '1rem'}}>
                    <Typography weight="SemiBold" size="h5" gutterBottom>
                        {t('footer.headline_4')}
                    </Typography>

                    <Box component="ul" sx={{ display: 'flex', paddingLeft: '0', margin: '.5rem 0 1.5rem' }}>
                        <Box component="a"
                            href="https://facebbok.com/tzconnect"
                            sx={iconStyle}>
                            <FacebookStyled
                                src={'/img/facebook.png'}
                                alt="Facebook"
                            />
                        </Box>
                        <Box
                            component="a"
                            href="https://twitter.com/tzconnect"
                            sx={iconStyle}
                        >
                            <TwitterStyled
                                src={'/img/twitter.jpeg'}
                                alt="Twitter"
                            />
                        </Box>
                        <Box component="a"
                            href="https://facebbok.com/tzconnect"
                            sx={iconStyle}>
                            <FacebookStyled
                                src={'/img/facebook.png'}
                                alt="Facebook"
                            />
                        </Box>
                        <Box
                            component="a"
                            href="https://twitter.com/tzconnect"
                            sx={iconStyle}
                        >
                            <TwitterStyled
                                src={'/img/twitter.jpeg'}
                                alt="Twitter"
                            />
                        </Box>
                    </Box>

                    <Box sx={{ marginTop: '2.5rem'}} >
                        <Copyright />
                    </Box>
                </Grid>
            </Grid>
        </StyledBox>
    )
}