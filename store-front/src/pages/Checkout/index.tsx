import { t } from 'i18next';
import { toast } from 'react-toastify';
import { Link, Prompt, useHistory } from 'react-router-dom';
import { INft } from '../../interfaces/artwork';
import { FC, useEffect, useRef, useState } from 'react';
import {
    Paper,
    Slide,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Theme,
    useMediaQuery,
} from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';

import useAxios from 'axios-hooks';
import styled from '@emotion/styled';
import DoneIcon from '@mui/icons-material/Done';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';
import Typography from '../../design-system/atoms/Typography';
import CustomButton from '../../design-system/atoms/Button';
import ShoppingCartItem from '../../design-system/molecules/ShoppingCartItem';
import { Animated } from 'react-animated-css';
import Success from '../../design-system/atoms/Success';
import StripeCheckoutForm from '../../design-system/organismes/StripeCheckOutForm';

import { RPC_URL } from '../../global';
import { initTezos } from '../../contracts/init';

import get_transfer_object from '../../../../lib/tezpay/client/client.mjs';

interface CheckoutProps {
    loading: boolean;
    expiresAt: string;
    nftsInCart: INft[];
    listCart: Function;
    setNftsInCart: (input: INft[]) => void;
    setLoginOpen: (input: boolean) => void;
}

const StyledAnimated = styled(Animated)`
    height: 100%;
`;

const StyledLink = styled.a<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.primary.contrastText};
    text-decoration: none;

    &.active {
        p {
            font-family: 'Poppins Medium' !important;
            color: ${(props) => props.theme.palette.text.primary} !important;
        }
    }
`;

const StyledStepper = styled(Stepper)<{ theme?: Theme }>`
    width: 100%;
    .MuiStepIcon-text {
        fill: white !important;
    }

    .MuiSvgIcon-root.Mui-active {
        color: ${(props) =>
            props.theme.palette.primary.contrastText} !important;
    }

    @media (max-width: 874px) {
        display: none;
    }
`;

const StyledStep = styled(Step)<{ theme?: Theme; previousStepValid: boolean }>`
    .MuiStepConnector-line {
        border-color: ${(props) =>
            props.previousStepValid
                ? props.theme.palette.primary.contrastText
                : '#c4c4c4'} !important;
        transition: color 0.2s;
    }
`;

const StyledStepLabel = styled(StepLabel)<{ theme?: Theme }>`
    .MuiSvgIcon-root.Mui-completed {
        color: ${(props) =>
            props.theme.palette.primary.contrastText} !important;
    }
`;

const StyledPaper = styled(Paper)<{
    theme?: Theme;
    translateX: boolean;
    disabled: boolean;
}>`
    filter: ${(props) => props.theme.dropShadow.avatar};
    box-shadow: none;
    width: 50%;
    background-image: none;

    pointer-events: ${(props) => (props.disabled ? 'none' : '')};
    opacity: ${(props) => (props.disabled ? '0.4' : '1')};

    transition: opacity 0.2s;
    padding: 2rem;

    @media (max-width: 874px) {
        width: 90%;
        padding: 1.2rem !important;
    }
`;

const StyledPaymentStack = styled(Stack)<{
    theme?: Theme;
    selected: boolean;
    disabled?: boolean;
}>`
    cursor: pointer;
    border: 1px solid
        ${(props) =>
            props.selected
                ? props.theme.palette.primary.contrastText
                : props.theme.palette.background.paper};
    border-radius: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    align-items: center;
    transition: border 0.2s;
    height: 5rem;
    opacity: ${(props) => (props.disabled ? 0.5 : 1)};

    :hover {
        border: 1px solid
            ${(props) =>
                props.disabled
                    ? '#c4c4c4'
                    : props.theme.palette.primary.contrastText};
    }

    :active {
        border: 1px solid #c4c4c4;
    }
`;

const StyledImage = styled.img<{ theme?: Theme }>`
    filter: ${(props) => props.theme.logo};
    max-height: 2.5rem;
    width: 2.5rem;
    margin-right: 2rem;
`;

const StyledDoneIcon = styled(DoneIcon)<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.primary.contrastText};
`;

const steps = ['Summary', 'Payment method', 'Checkout'];

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK_KEY!);

export const Checkout: FC<CheckoutProps> = ({ ...props }) => {
    const history = useHistory();
    const isMobile = useMediaQuery('(max-width: 874px)');

    const [activeStep, setActiveStep] = useState<number>(0);

    const wrapperRef = useRef();
    const wrapperRefSlide = useRef();

    const [timeLeft, setTimeLeft] = useState<number>();
    const [isWarned, setIsWarned] = useState(false);
    const [isExpiredError, setIsExpiredError] = useState(false);

    const [deleteFromCartResponse, deleteFromCart] = useAxios('', {
        manual: true,
    });

    const [concernedDeletedNFT, setConcernedDeletedNft] = useState<number>();

    const handleDeleteFromBasket = (nftId: number) => {
        if (activeStep > 1) {
            return false;
        }

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
            .then((res: any) => {
                if (res.status === 204) {
                    props.listCart();
                }
            })
            .catch((err: any) => {
                toast.error(err.response?.data?.message ?? 'An error occured');
            });
    };

    useEffect(() => {
        if (isExpiredError && timeLeft && timeLeft < 0) {
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
                `Your cart will expire in ${new Date(
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

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
        'stripe' | 'tezos'
    >();
    const [errorMessagePaymentMethod, setErrorMessagePaymenMethod] =
        useState<string>();

    const selectPaymentMethod = (input: 'stripe' | 'tezos') => {
        setErrorMessagePaymenMethod(undefined);
        setSelectedPaymentMethod(input);
    };

    const [paymentIntentSecret, getPaymentIntentSecret] = useAxios(
        {
            url:
                process.env.REACT_APP_API_SERVER_BASE_URL +
                '/payment/create-payment-intent',
            method: 'POST',
            withCredentials: true,
            data: {
                currency: selectedPaymentMethod === 'stripe' ? 'EUR' : 'XTZ',
            },
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

    const handleBackwardStep = () => {
        if (activeStep === 0) {
            history.push('/store');
        }

        setActiveStep(activeStep - 1);
    };

    const handleForwardStep = () => {
        if (activeStep === 0) {
            setActiveStep(activeStep + 1);
        }

        if (activeStep === 1 && !selectedPaymentMethod) {
            setErrorMessagePaymenMethod(
                'You need to select at least one payment method to continue',
            );
            return false;
        }

        if (activeStep === 1 && selectedPaymentMethod) {
            getPaymentIntentSecret()
                .then(() => {
                    setActiveStep(activeStep + 1);
                })
                .catch((err) => {
                    if (err.response.status === 401) {
                        props.setLoginOpen(true);
                        return;
                    }
                });
        }

        if (activeStep === 3) {
            history.push(
                `/profile/${localStorage.getItem('Kanvas - address')}`,
            );
        }
    };

    useEffect(() => {
        if (paymentIntentSecret.data && selectedPaymentMethod === 'stripe') {
            const appearance = {
                theme: 'flat' as 'flat',
            };
            setStripeOptions({
                appearance: appearance,
                clientSecret: paymentIntentSecret.data.clientSecret,
            });
        }

        if (paymentIntentSecret.data && selectedPaymentMethod === 'tezos') {
            // tezpay client logic here...
            let tezos = initTezos(RPC_URL);
            let { amount: mutez_amount, receiverAddress: receiver_address } =
                paymentIntentSecret.data;
            let message = 'Hello, world!';

            console.log(get_transfer_object(tezos, {
                receiver_address,
                mutez_amount,
                message,
            }));
        }

        if (paymentIntentSecret.response?.status === 401) {
            return;
        }
        if (
            paymentIntentSecret.error &&
            paymentIntentSecret.error.response?.status !== 401
        ) {
            toast.error('Something went wrong with the cart, please refresh');
        }
    }, [paymentIntentSecret]);

    const [stripeOptions, setStripeOptions] = useState<StripeElementsOptions>({
        clientSecret: undefined,
    });

    useEffect(() => {
        if (selectedPaymentMethod) {
            handleForwardStep();
        }
    }, [selectedPaymentMethod]);

    return (
        <PageWrapper>
            <Stack
                direction="column"
                ref={wrapperRefSlide}
                spacing={3}
                style={{
                    maxWidth: '100rem',
                    width: '100%',
                    alignItems: 'center',
                    paddingBottom: '5rem',
                }}
            >
                <FlexSpacer minHeight={isMobile ? 6 : 8} />

                <StyledStepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label, index) => (
                        <StyledStep
                            previousStepValid={index < activeStep + 1}
                            key={label}
                        >
                            <StyledStepLabel>{label}</StyledStepLabel>
                        </StyledStep>
                    ))}
                </StyledStepper>

                <FlexSpacer minHeight={1} />

                <Slide
                    direction="right"
                    in={activeStep < 3}
                    container={wrapperRefSlide.current}
                    mountOnEnter
                    unmountOnExit
                >
                    <Stack
                        direction={{ md: 'row', xs: 'column' }}
                        ref={wrapperRef}
                        spacing={3}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {/* Summary */}
                        <StyledPaper
                            translateX={activeStep > 0}
                            disabled={activeStep > 0}
                        >
                            <Stack
                                direction="column"
                                spacing={4}
                                sx={{
                                    minHeight: '25rem',
                                    justifyContent: 'center',
                                }}
                            >
                                {props.loading ? (
                                    [...new Array(3)].map(() => (
                                        <ShoppingCartItem
                                            loading={true}
                                            removeNft={() => {}}
                                        />
                                    ))
                                ) : props.nftsInCart.length > 0 ? (
                                    <>
                                        {props.nftsInCart.map((nft) => (
                                            <ShoppingCartItem
                                                loading={false}
                                                nft={nft}
                                                removeNftLoading={
                                                    deleteFromCartResponse.loading &&
                                                    concernedDeletedNFT ===
                                                        nft.id
                                                }
                                                removeNft={
                                                    handleDeleteFromBasket
                                                }
                                            />
                                        ))}

                                        <FlexSpacer />

                                        <Stack direction="row">
                                            <Typography
                                                size="h4"
                                                weight="SemiBold"
                                                display="initial !important"
                                                align="left"
                                            >
                                                Total
                                            </Typography>

                                            <FlexSpacer />

                                            <Typography
                                                size="h4"
                                                weight="SemiBold"
                                                display="initial !important"
                                                align="right"
                                            >
                                                {`${calculateTotal(
                                                    props.nftsInCart.map(
                                                        (nft) => nft.price,
                                                    ),
                                                )} ꜩ`}
                                            </Typography>
                                        </Stack>
                                    </>
                                ) : (
                                    <Typography
                                        size="Subtitle1"
                                        weight="Medium"
                                        display="initial !important"
                                        align="center"
                                        color="#C4C4C4"
                                    >
                                        {'Empty Shopping Cart..'}
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
                                            ? `Your cart will expire in ${Math.round(
                                                  timeLeft / 60000,
                                              )}
                                minutes.`
                                            : 'Cart Expired'}
                                    </Typography>
                                )}
                            </Stack>
                        </StyledPaper>

                        {/* Slider with select payment method */}
                        <Slide
                            direction="left"
                            in={activeStep >= 1}
                            container={wrapperRef.current}
                            mountOnEnter
                            unmountOnExit
                        >
                            <StyledPaper translateX={false} disabled={false}>
                                {activeStep === 1 ? (
                                    <Animated
                                        animationIn="fadeIn"
                                        animationOut="fadeOut"
                                        isVisible={true}
                                    >
                                        <Typography
                                            size="h4"
                                            weight="SemiBold"
                                            display="initial !important"
                                        >
                                            {t(
                                                'checkout.headline_payment_method',
                                            )}
                                        </Typography>

                                        <FlexSpacer minHeight={2} />

                                        <Stack direction="column" spacing={2}>
                                            <StyledPaymentStack
                                                direction="row"
                                                selected={
                                                    selectedPaymentMethod ===
                                                    'stripe'
                                                }
                                                onClick={() =>
                                                    selectPaymentMethod(
                                                        'stripe',
                                                    )
                                                }
                                            >
                                                <StyledImage src="img/stripe-logo.png" />
                                                <Stack direction="column">
                                                    <Typography
                                                        size="h5"
                                                        weight="SemiBold"
                                                        display="initial !important"
                                                    >
                                                        stripe
                                                    </Typography>
                                                    <Typography
                                                        size="subtitle2"
                                                        weight="Light"
                                                        display="initial !important"
                                                        color="contrastText"
                                                        type="link"
                                                    >
                                                        <StyledLink
                                                            href="https://stripe.com/"
                                                            target="_blank"
                                                        >
                                                            {t(
                                                                'checkout.link_payment_method',
                                                            )}
                                                        </StyledLink>
                                                    </Typography>
                                                </Stack>
                                                <FlexSpacer />
                                                {selectedPaymentMethod ===
                                                    'stripe' && (
                                                    <StyledDoneIcon />
                                                )}
                                            </StyledPaymentStack>
                                            <StyledPaymentStack
                                                direction="row"
                                                selected={
                                                    selectedPaymentMethod ===
                                                    'tezos'
                                                }
                                                onClick={() => {
                                                    selectPaymentMethod(
                                                        'tezos',
                                                    );
                                                }}
                                            >
                                                <StyledImage src="img/tezos-logo.png" />
                                                <Stack direction="column">
                                                    <Typography
                                                        size="h5"
                                                        weight="SemiBold"
                                                        display="initial !important"
                                                    >
                                                        Tezos
                                                    </Typography>
                                                    <Typography
                                                        size="subtitle2"
                                                        weight="Light"
                                                        display="initial !important"
                                                        color="contrastText"
                                                        type="link"
                                                    >
                                                        <StyledLink
                                                            href="https://tezos.com/"
                                                            target="_blank"
                                                        >
                                                            {t(
                                                                'checkout.link_payment_method',
                                                            )}
                                                        </StyledLink>
                                                    </Typography>
                                                </Stack>
                                                <FlexSpacer />
                                                {selectedPaymentMethod ===
                                                    'tezos' && (
                                                    <StyledDoneIcon />
                                                )}
                                            </StyledPaymentStack>
                                            {errorMessagePaymentMethod && (
                                                <Typography
                                                    size="h5"
                                                    weight="Light"
                                                    color="error"
                                                    sx={{ pt: 2 }}
                                                >
                                                    {errorMessagePaymentMethod}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Animated>
                                ) : (
                                    <StyledAnimated
                                        animationIn="fadeIn"
                                        animationOut="fadeOut"
                                        isVisible={true}
                                    >
                                        <Typography
                                            size="h4"
                                            weight="SemiBold"
                                            display="initial !important"
                                        >
                                            {t(
                                                'checkout.headline_payment_method_2',
                                            )}
                                        </Typography>
                                        <Stack
                                            direction="row"
                                            spacing={3}
                                            style={{
                                                width: '100%',
                                                justifyContent: 'center',
                                                height: '90%',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {/* Strip data */}
                                            {stripeOptions.clientSecret !==
                                                undefined &&
                                                selectedPaymentMethod ===
                                                    'stripe' && (
                                                    <Elements
                                                        stripe={stripePromise}
                                                        options={stripeOptions}
                                                    >
                                                        <StripeCheckoutForm
                                                            activeStep={
                                                                activeStep
                                                            }
                                                            setActiveStep={
                                                                setActiveStep
                                                            }
                                                            setNftsInCart={
                                                                props.setNftsInCart
                                                            }
                                                        />
                                                    </Elements>
                                                )}

                                            {selectedPaymentMethod ===
                                                'tezos' && (
                                                <p>
                                                    Initializating payment with
                                                    wallet...
                                                </p>
                                            )}
                                        </Stack>
                                    </StyledAnimated>
                                )}
                            </StyledPaper>
                        </Slide>
                    </Stack>
                </Slide>

                {/* Success paper */}
                {activeStep === 3 && (
                    <Animated
                        animationIn="fadeIn"
                        animationOut="fadeOut"
                        isVisible={activeStep === 3}
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <StyledPaper translateX={false} disabled={false}>
                            <Stack
                                direction="column"
                                spacing={4}
                                sx={{
                                    justifyContent: 'center',
                                    padding: '2rem',
                                }}
                            >
                                <Success />
                                <Typography
                                    size="h4"
                                    weight="Light"
                                    align="center"
                                >
                                    {
                                        'Payment successfull, you will shortly be able to see your NFTs in your wallet and in your profile '
                                    }
                                </Typography>
                            </Stack>
                        </StyledPaper>
                    </Animated>
                )}

                <FlexSpacer minHeight={1} />

                <Stack direction="row">
                    {activeStep <= 2 && (
                        <>
                            <CustomButton
                                size="small"
                                onClick={() => handleBackwardStep()}
                                label={t('checkout.back_button')}
                            />
                            <FlexSpacer minWidth={2} />
                        </>
                    )}

                    {(activeStep < 2 || activeStep === 3) && (
                        <CustomButton
                            size="small"
                            onClick={() => handleForwardStep()}
                            label={t(`checkout.next_button_${activeStep}`)}
                            loading={paymentIntentSecret.loading}
                            disabled={
                                props.nftsInCart.length === 0 && activeStep < 3
                            }
                        />
                    )}
                </Stack>
            </Stack>

            {/* Button validate step or go bvack to profile */}
        </PageWrapper>
    );
};
