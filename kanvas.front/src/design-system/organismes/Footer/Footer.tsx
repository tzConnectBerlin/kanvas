import { Box } from '@mui/system';
import Grid from '@mui/material/Grid';
import { FC } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Theme } from '@mui/material';
import Typography from '../../atoms/Typography';
import { Copyright } from '../../atoms/Copyright';

export interface FooterProps {
    selectedTheme?: string;
}

const LinkStyled = styled(Link)`
    transition: 0.2s;
    position: absolute;
    top: 0;
    align-items: center;
`

const LogoStyled = styled.img<{ theme?: Theme }>`
    filter: ${props => props.theme.logo.filter ?? 'invert(0%)'};
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
const StyledBox = styled(Box) <{ theme?: Theme }>`
    margin-bottom: -6rem;
    color: ${props => props.theme.palette.text.primary};
    
    background-color: ${props => props.theme.footer.background};

    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);

    position: sticky;
    top: 0;
    z-index: 10;
    transition: padding-left 0.2s, padding-right 0.2s;
    padding-left: 3rem;

    @media (max-width: 900px) {
        padding-left: 1.5rem;
        padding-right: 1rem !important;
        transition: padding-left 0.2s, padding-right 0.2s;
    }
`


// const Spacer = styled.div<FlexSpacerProps>`
//     flex-grow: 1;
//     justify-
//     width: ${props => props.display ? '' : '0rem'};
//     transition: width 0.2s;
// `

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
  
  @media (max-width: 1100px) {
      height: 2rem;
  }

  &.active {
      p {
          font-family: 'Poppins Medium' !important;
          color: ${props => props.theme.palette.text.primary} !important;
      }
  }
`

export const Footer: FC<FooterProps> = () => {
    const { t } = useTranslation(['translation']);

    return (
        <StyledBox sx={{
            height: '5rem',
            display: 'flex',
            alignItems: 'center',
            paddingRight: '2rem',
        }}>
            <Grid direction="column" item xs={12} sm={12} md={3}>
                <Grid item sx={{ display: 'flex' }}>
                    <LinkStyled to='/'>
                        <LogoStyled alt='Logo' src={'/img/Logo.svg'} />
                    </LinkStyled>
                </Grid>

                <Grid item>
                    <Copyright />
                </Grid>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
                <Typography size="h6" weight="SemiBold" gutterBottom>
                    More About us
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

            <Grid item xs={12} sm={12} md={4}>
                <Typography weight="SemiBold" size="h6" gutterBottom>
                    Legal
                </Typography>

                <Box component="ul" sx={{ m: 0, listStyle: 'none', p: 0 }}>
                    <Box component="li" sx={{ py: 0.5 }}>
                        <StyledLink to="/premium-themes/onepirate/terms/">Terms</StyledLink>
                    </Box>
                    <Box component="li" sx={{ py: 0.5 }}>
                        <StyledLink to="/premium-themes/onepirate/privacy/">Privacy</StyledLink>
                    </Box>
                </Box>
            </Grid>

            <Grid item xs={12} sm={8} md={4}>
                <Typography weight="SemiBold" size="h6" gutterBottom>
                    Social
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
            </Grid>
        </StyledBox>
    )
}