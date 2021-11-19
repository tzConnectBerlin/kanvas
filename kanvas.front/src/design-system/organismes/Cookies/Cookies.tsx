import { Box } from '@mui/system'
import Grid from '@mui/material/Grid'
import { FC } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { Theme } from '@mui/material'
import Typography from '../../atoms/Typography'

import { useTranslation } from 'react-i18next'


export interface CookiesProps {
  selectedTheme?: string
  theme?: Theme
}

const StyledBox = styled(Box)<{ theme?: Theme }>`
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  box-shadow: none;
  background-color: grey;
  padding: 2rem 1rem 1rem;
  border-radius: 0.25rem;
  color: rgb(255, 255, 255);
  position: sticky;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 100;
`
const LinkStyled = styled(Link)`
  display: block;
  transition: 0.2s;
  width: 100%;
  height: 2.5rem;
  align-items: center;
`

const LogoStyled = styled.img<{ theme?: Theme }>`
  filter: ${(props) => props.theme.logo.filter ?? 'invert(0%)'};
  display: block;
  height: 1.8rem;
  transition: height 0.2s;

  @media (max-width: 650px) {
    height: 1.8rem;
    transition: height 0.2s;
  }
`
   

export const Cookies: FC<CookiesProps> = () => {
  const { t } = useTranslation(['translation'])

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
            marginTop: '1rem',
            fontSize: '.7rem',
            alignSelf: 'start',
            marginBottom: '1rem',
          }}
        >
         COOKIE LAYER 
        </Typography>
      </Grid>       
    </StyledBox>
  )
}
