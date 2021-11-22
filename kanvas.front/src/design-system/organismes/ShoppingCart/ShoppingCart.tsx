import styled from '@emotion/styled'
import ClearIcon from '@mui/icons-material/Clear'
import Typography from '../../atoms/Typography'
import FlexSpacer from '../../atoms/FlexSpacer'
import Avatar from '../../atoms/Avatar'
import CustomButton from '../../atoms/Button'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';

import { FC, useEffect } from 'react'
import { Skeleton, Stack, Theme } from '@mui/material'
import { INft } from '../../../interfaces/artwork'
import useAxios from 'axios-hooks'
import { toast } from 'react-toastify'

interface ShoppingCartProps {
  nftsInCart: INft[]
  setNftsInCart: Function
  closeCart: Function
  loading: boolean
  open: boolean
}

const ContainerPopupStyled = styled.div<{ open: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 3;

  visibility: ${(props) => (props.open ? 'visible' : 'hidden')}!important;
  opacity: ${(props) => (props.open ? 1 : 0)} !important;
`

const WrapperCart = styled.div<{ theme?: Theme; open: boolean }>`
  max-width: ${(props) => (props.open ? 25 : 0)}rem;
  width: ${(props) => (props.open ? 35 : 0)}%;
  height: 101vh;
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 5;
  top: 0;

  overflow: auto;

  margin-top: 5rem;

  padding-bottom: 2.5rem;

  background-color: ${(props) => props.theme.palette.background.paper};
  opacity: 1;

  p {
    opacity: ${(props) => (props.open ? 1 : 0)} !important;
    transition: opacity 0.1s;
  }

  transition: max-width 0.3s, width 0.3s, padding 0.5s;

  @media (max-width: 1100px) {
    width: ${(props) => (props.open ? 40 : 0)}%;
  }

  @media (max-width: 730px) {
    width: ${(props) => (props.open ? 50 : 0)}%;
  }

  @media (max-width: 650px) {
    width: ${(props) => (props.open ? 100 : 0)}%;
  }
`

const StyledDiv = styled.div<{ theme?: Theme }>`
  height: 1.5rem;
  width: 1.5rem;
  margin: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid ${(props) => props.theme.palette.text.primary};

  :hover {
    outline: 1px solid ${(props) => props.theme.palette.text.primary};
    transition: outline 0.1s;
  }

  :active {
    outline: 1px solid #c4c4c4;
    transition: outline 0.1s;
  }
`

const StyledClearIcon = styled(ClearIcon) <{ theme?: Theme }>`
  color: ${(props) => props.theme.palette.text.primary};
`

export const ShoppingCart: FC<ShoppingCartProps> = ({ ...props }) => {

  const [deleteFromCartResponse, deleteFromCart] = useAxios(
    process.env.REACT_APP_API_SERVER_BASE_URL + '/cart/delete/:id',
    { manual: true },
  )

  const handleDeleteFromBasket = (nftId: number) => {
    deleteFromCart({
      url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/cart/remove/` + nftId.toString(),
      withCredentials: true,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': process.env.REACT_APP_API_SERVER_BASE_URL?? 'http://localhost:3000'
      }
    }).then(res => {
      debugger
      if (res.status === 204) {
        props.setNftsInCart(props.nftsInCart.filter(nfts => nfts.id !== nftId))
      }
    }).catch(err => {
      toast.error(err.message)
    })
  }

  useEffect(() => {
    if (props.open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [props.open])

  return (
    <>
      <ContainerPopupStyled
        open={props.open}
        onClick={() => props.closeCart()}
      ></ContainerPopupStyled>

      <WrapperCart open={props.open}>
        <Stack direction="row">
          <Typography
            size="h2"
            weight="SemiBold"
            sx={{ marginTop: '1rem', marginLeft: '1rem' }}
          >
            {' '}
            Summary{' '}
          </Typography>
          <FlexSpacer />
          <Typography
            size="h5"
            weight="Medium"
            sx={{ marginTop: '1rem', marginRight: '1rem' }}
          >
            {' '}
            {
              props.nftsInCart.length ?
                <>{props.nftsInCart.length} - items{' '}</>
                :
                undefined
            }
          </Typography>
        </Stack>

        <FlexSpacer minHeight={3} />

        <Stack
          direction="column"
          spacing={4}
          sx={{
            paddingBottom: '20rem',
            marginLeft: '1rem',
            marginRight: '1rem',
          }}
        >
          {props.loading
            ? [...new Array(3)].map(() => (
              <Stack
                direction="row"
                spacing={4}
                sx={{ width: 'auto', alignItems: 'center' }}
              >
                <Skeleton
                  animation="pulse"
                  width={65}
                  height={65}
                  sx={{
                    borderRadius: 0,
                    transform: 'none',
                    transformOrigin: 'none',
                  }}
                />
                <Stack
                  direction="column"
                  spacing={1}
                  sx={{ width: 'auto', minWidth: '60%' }}
                >
                  <Skeleton
                    animation="pulse"
                    height={14}
                    width="60%"
                    sx={{ borderRadius: 0 }}
                  />
                  <Skeleton
                    animation="pulse"
                    height={14}
                    width="40%"
                    sx={{ borderRadius: 0 }}
                  />
                </Stack>
              </Stack>
            ))
            : props.nftsInCart.length > 0 ?
              props.nftsInCart.map((nft) => (
                <Stack
                  direction="row"
                  spacing={4}
                  sx={{
                    paddingLeft: '1rem',
                    width: 'auto',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Avatar
                    src={nft.dataUri ? nft.dataUri : undefined}
                    height={62}
                    width={62}
                    borderRadius={0}
                    responsive
                  >
                    <ImageNotSupportedOutlinedIcon />
                  </Avatar>
                  <Stack
                    direction="column"
                    spacing={1}
                    sx={{ width: 'auto', minWidth: '60%' }}
                  >
                    <Typography
                      size="h4"
                      weight="Medium"
                      display="initial !important"
                      noWrap
                      sx={{ cursor: 'pointer' }}
                    >
                      {' '}
                      {nft.name}{' '}
                    </Typography>
                    <Typography
                      size="body2"
                      weight="Light"
                      display="initial !important"
                      noWrap
                      color="#C4C4C4"
                      sx={{ cursor: 'pointer' }}
                    >
                      {' '}
                      {nft.ipfsHash}{' '}
                    </Typography>
                  </Stack>
                  <StyledDiv onClick={() => handleDeleteFromBasket(nft.id)}>
                    <StyledClearIcon />
                  </StyledDiv>
                </Stack>
              ))
              :
              <Typography
                size="h5"
                weight="Medium"
                display="initial !important"
                noWrap
                align="center"
                color="#C4C4C4"
                sx={{ cursor: 'pointer' }}
              >
                {'Empty Shopping Cart..'}
              </Typography>
          }

          <FlexSpacer />

          {props.open ? (
            <CustomButton
              size="medium"
              label="Checkout"
              disabled={props.nftsInCart.length === 0}
              sx={{ bottom: 0, marginLeft: '1rem', marginRight: '1rem' }}
            />
          ) : undefined}
        </Stack>
      </WrapperCart>
    </>
  )
}
