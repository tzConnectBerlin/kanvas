import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';
import CustomButton from '../../atoms/Button';
import ShoppingCartItem from '../../molecules/ShoppingCartItem';
import useAxios from 'axios-hooks';

import { FC, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Stack, Theme } from '@mui/material';
import { INft } from '../../../interfaces/artwork';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TezosLogo from '../../atoms/TezosLogo/TezosLogo';

interface ShoppingCartProps {
    nftsInCart: INft[];
    setNftsInCart: Function;
    closeCart: Function;
    loading: boolean;
    open: boolean;
    listCart: Function;
    expiresAt: string;
}

const ContainerPopupStyled = styled.div<{ open: boolean }>`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    height: 100vh;
    z-index: 11;

    width: ${(props) => (props.open ? 100 : 0)}%;
    visibility: ${(props) => (props.open ? 'visible' : 'hidden')}!important;
    opacity: ${(props) => (props.open ? 1 : 0)} !important;

    @media (max-width: 1100px) {
        width: ${(props) => (props.open ? 60 : 0)}%;
    }

    @media (max-width: 730px) {
        width: ${(props) => (props.open ? 50 : 0)}%;
    }

    @media (max-width: 600px) {
        width: ${(props) => (props.open ? 100 : 0)}%;
        height: 4.5rem;
    }
`;

const WrapperCart = styled.div<{ theme?: Theme; open: boolean }>`
    max-width: ${(props) => (props.open ? 25 : 0)}rem;
    width: ${(props) => (props.open ? 35 : 0)}%;
    height: 101vh;
    position: fixed;
    right: 0;
    bottom: 0;
    z-index: 12;
    top: 0;
    border-top: 1px solid black;

    filter: ${(props) => props.theme.dropShadow.shoppingCart};

    overflow: auto;

    margin-top: 4.5rem;

    padding-bottom: 2.5rem;

    background-color: ${(props) => props.theme.palette.background.default};
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

    @media (max-width: 600px) {
        width: ${(props) => (props.open ? 100 : 0)}%;
    }
`;

export const StyledStackWrapper = styled(Stack)<{ theme?: Theme }>`
    width: 100%;
    border-top: 1px solid #c4c4c4;
    padding-top: 1rem;
`;

export const ShoppingCart: FC<ShoppingCartProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);
    const history = useHistory();
    const [timeLeft, setTimeLeft] = useState<number>();

    const [deleteFromCartResponse, deleteFromCart] = useAxios('', {
        manual: true,
    });

    const [checkoutResponse, checkout] = useAxios(
        {
            url:
                process.env.REACT_APP_API_SERVER_BASE_URL +
                '/users/cart/checkout',
            method: 'POST',
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem(
                    'Kanvas - Bearer',
                )}`,
            },
        },
        {
            manual: true,
        },
    );

    useEffect(() => {
        if (
            checkoutResponse.loading === false &&
            checkoutResponse.response?.status === 204
        ) {
            toast.info('Congratulations for your purchase');
            props.listCart();
            props.closeCart();
            history.push(
                `/profile/${localStorage.getItem('Kanvas - address')}`,
            );
        } else if (checkoutResponse.error?.response?.status === 401) {
            props.listCart();
        }
    }, [checkoutResponse]);

    const [concernedDeletedNFT, setConcernedDeletedNft] = useState<number>();

    const handleDeleteFromBasket = (nftId: number) => {
        setConcernedDeletedNft(nftId);
        deleteFromCart({
            url:
                process.env.REACT_APP_API_SERVER_BASE_URL +
                '/users/cart/remove/' +
                nftId,
            method: 'POST',
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem(
                    'Kanvas - Bearer',
                )}`,
            },
        })
            .then((res) => {
                if (res.status === 204) {
                    props.listCart();
                }
            })
            .catch((err) => {
                toast.error(err.response?.data?.message ?? 'An error occured');
            });
    };

    useEffect(() => {
        if (props.open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [props.open]);

    const [isWarned, setIsWarned] = useState(false);
    const [isExpiredError, setIsExpiredError] = useState(false);

    useEffect(() => {
        if (isExpiredError && (timeLeft === 0 || (timeLeft && timeLeft < 0))) {
            setIsExpiredError(true);
            toast.error('Your cart has expired');
            props.listCart();
        }

        if (!timeLeft) return;
        setInterval(() => {
            setTimeLeft(
                new Date(props.expiresAt).getTime() - new Date().getTime(),
            );
        }, 60000);

        if (timeLeft < 300000 && !isWarned) {
            toast.warning(
                `Your card will expire in ${new Date(
                    timeLeft,
                ).getMinutes()} minutes`,
            );
            setIsWarned(true);
        }
    }, [timeLeft]);

    useEffect(() => {
        setTimeLeft(new Date(props.expiresAt).getTime() - new Date().getTime());
    }, [props.expiresAt]);

    const calculateTotal = (priceArray: number[]) =>
        priceArray.reduce(
            (total: number, price: number) => (total += price),
            0,
        );

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
                        {t('cart.summary')}
                    </Typography>
                    <FlexSpacer />
                    <Typography
                        size="h5"
                        weight="Medium"
                        sx={{ marginTop: '1rem', marginRight: '1rem' }}
                    >
                        {props.nftsInCart.length > 0 && (
                            <>
                                {props.nftsInCart.length} - {t('cart.items')}{' '}
                            </>
                        )}
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
                    {props.loading ? (
                        [...new Array(3)].map(() => (
                            <ShoppingCartItem
                                loading={true}
                                removeNft={() => {}}
                                key={`shopping-loading-${
                                    new Date().getTime() + Math.random()
                                }`}
                            />
                        ))
                    ) : props.nftsInCart.length > 0 ? (
                        <>
                            {props.nftsInCart.map((nft) => (
                                <ShoppingCartItem
                                    loading={false}
                                    nft={nft}
                                    key={`in-cart-${
                                        new Date().getTime() + Math.random()
                                    }`}
                                    removeNftLoading={
                                        deleteFromCartResponse.loading &&
                                        concernedDeletedNFT === nft.id
                                    }
                                    removeNft={handleDeleteFromBasket}
                                />
                            ))}

                            <FlexSpacer />

                            <StyledStackWrapper direction="row">
                                <Typography
                                    size="h4"
                                    weight="SemiBold"
                                    display="initial !important"
                                    align="left"
                                    aria-label="subtitle"
                                    >
                                    {t('common.total')}
                                </Typography>

                                <FlexSpacer />

                                <Typography
                                    size="h4"
                                    weight="SemiBold"
                                    align="right"
                                    style={{ display: 'flex', alignItems: 'center', }}
                                >
                                    {`${calculateTotal(
                                        props.nftsInCart.map(
                                            (nft) => nft.price,
                                        ),
                                    )}`}
                                    <TezosLogo width="18px" margin="0 0.2rem" />
                                </Typography>
                            </StyledStackWrapper>
                        </>
                    ) : (
                        <Typography
                            size="Subtitle1"
                            weight="Medium"
                            display="initial !important"
                            align="center"
                            color="#C4C4C4"
                            sx={{ marginBottom: '1.5rem' }}
                        >
                            {t('cart.empty')}
                        </Typography>
                    )}

                    {props.nftsInCart.length > 0 && (
                        <Typography
                            size="subtitle2"
                            weight="Medium"
                            display="initial !important"
                            align="left"
                            color="#C4C4C4"
                        >
                            {timeLeft && timeLeft > 0
                                ? `${t('checkout.expireIn')} ${Math.round(
                                      timeLeft / 60000,
                                  )}
                                ${t('cart.minutes')}.`
                                : `${t('cart.expired')}`}
                        </Typography>
                    )}

                    {props.open && (
                        <CustomButton
                            size="medium"
                            label={t('cart.goCheckout')}
                            onClick={() => {
                                props.closeCart();
                                history.push('/checkout');
                            }}
                            disabled={props.nftsInCart.length === 0}
                            loading={checkoutResponse.loading}
                            sx={{
                                bottom: 0,
                                marginLeft: '1rem',
                                marginRight: '1rem',
                                marginTop: '1rem !important',
                            }}
                        />
                    )}
                </Stack>
            </WrapperCart>
        </>
    );
};
