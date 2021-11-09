import styled from '@emotion/styled';

import { FC } from 'react';
import { Skeleton, Stack, Theme } from '@mui/material';
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';

interface ShoppingCartProps {
    closeCart: Function;
    open: boolean;
}

const ContainerPopupStyled = styled.div<{open: boolean}>`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right:0;
    height: 100vh;
    z-index: 3;

    visibility: ${props => props.open ? 'visible' : 'hidden'}!important;
    opacity: ${props => props.open ? 1 : 0} !important;
`

const WrapperCart = styled.div<{theme?: Theme, open: boolean}>`
    width: ${props => props.open ? 25 : 0}rem;
    height: 100vh;
    position: fixed;
    right: 0;
    bottom: 0;
    z-index: 5;
    top: 0;

    margin-top: 5rem;

    padding: ${props => props.open ? 1 : 0}rem;

    background-color: ${props => props.theme.palette.background.paper};
    opacity: 1;

    p {
        opacity: ${props => props.open ? 1 : 0} !important;
        transition: opacity 0.1s;
    }

    transition: width 0.3s;
`


const mokeNft = [
    {
        "id": 4,
        "name": "first_nft",
        "ipfsHash": '',
        "price": 10,
        "metadata": {
          "key2": "value1",
          "test": "hey"
        },
        "dataUrl": "heyyy",
        "contract": "contract_address",
        "tokenId": "teojteojt"
      },
      {
        "id": 3,
        "name": "second_nft",
        "ipfsHash": '',
        "price": 12,
        "metadata": {
          "key2": "value1",
          "test": "hey"
        },
        "dataUrl": "heyyy",
        "contract": "contract_address",
        "tokenId": "teojteojt"
      },
      {
        "id": 4,
        "name": "third_nft",
        "ipfsHash": '',
        "price": 10,
        "metadata": {
          "key2": "value1",
          "test": "hey"
        },
        "dataUrl": "heyyy",
        "contract": "contract_address",
        "tokenId": "teojteojt"
      },
      {
        "id": 3,
        "name": "fourth_nft",
        "ipfsHash": '',
        "price": 12,
        "metadata": {
          "key2": "value1",
          "test": "hey"
        },
        "dataUrl": "heyyy",
        "contract": "contract_address",
        "tokenId": "teojteojt"
      },
      {
        "id": 3,
        "name": "fourth_nft",
        "ipfsHash": '',
        "price": 12,
        "metadata": {
          "key2": "value1",
          "test": "hey"
        },
        "dataUrl": "heyyy",
        "contract": "contract_address",
        "tokenId": "teojteojt"
      }
]

export const ShoppingCart : FC<ShoppingCartProps> = ({...props}) => {
    return (
        <>
            <ContainerPopupStyled open={props.open} onClick={() => props.closeCart()}></ContainerPopupStyled>

            <WrapperCart open={props.open}>
                <Stack direction="row">
                    <Typography size="h2" weight="SemiBold"> Summary </Typography>
                    <FlexSpacer/>
                    <Typography size="h5" weight="Medium"> 3 - items </Typography>
                </Stack>

                <FlexSpacer minHeight={3}/>

                <Stack direction="column" spacing={4} sx={{marginLeft: '1rem'}}>
                    {
                        true ?
                            [{},{},{}].map( () =>
                                <Stack direction="row" spacing={4} sx={{width: 'auto', alignItems: 'center'}}>
                                    <Skeleton animation="pulse" width={65} height={65} sx={{borderRadius: 0, transform: 'none', transformOrigin: 'none'}} />
                                    <Stack direction="column" spacing={1} sx={{width: 'auto', minWidth: '60%'}}>
                                        <Skeleton animation="pulse" height={14} width="60%" sx={{borderRadius: 0}}/>
                                        <Skeleton animation="pulse" height={14} width="40%" sx={{borderRadius: 0}}/>
                                    </Stack>
                                </Stack>
                            )
                        :
                            mokeNft.map(nft =>
                                <>
                                </>
                            )
                    }
                </Stack>

            </WrapperCart>

        </>
    )
}