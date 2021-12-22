import styled from '@emotion/styled';
import CustomButton from "../../atoms/Button";
import CircularProgress from "../../atoms/CircularProgress";
import Typography from "../../atoms/Typography";

import { Stack } from "@mui/material";
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { FC, useEffect, useState } from 'react';

const StyledForm = styled.form`
    display: flex;
    justify-content: center;
`

export const StripeCheckoutForm: FC<{ activeStep: number, setActiveStep: Function }> = ({ ...props }) => {

    const stripe = useStripe();
    const elements = useElements();
    // const elements = stripe!.elements({appearance});

    const [message, setMessage] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!stripe) {
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case "succeeded":
                    setMessage("Payment succeeded!");
                    break;
                case "processing":
                    setMessage("Your payment is processing.");
                    break;
                case "requires_payment_method":
                    setMessage("Your payment was not successful, please try again.");
                    break;
                default:
                    setMessage("Something went wrong.");
                    break;
            }
        });
    }, [stripe]);

    const handleSubmit = async (event: any) => {
        // We don't want to let default form submission happen here,
        // which would refresh the page.
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        setIsPaymentLoading(true)

        const { error } = await stripe.confirmPayment({
            //`Elements` instance that was used to create the Payment Element
            elements,
            redirect: 'if_required'
        });

        if (error?.type === "card_error" || error?.type === "validation_error") {
            setMessage(error?.message);
        } else {
            setMessage("An unexpected error occured.");
        }
        console.log(error)
        if (error === undefined) {
            props.setActiveStep(props.activeStep + 1)
        }

        setIsPaymentLoading(false)
    };

    return (
        <StyledForm onSubmit={handleSubmit}>
            <Stack direction="column" spacing={4} sx={{ justifyContent: 'center' }}>
                <PaymentElement onReady={() => setIsLoading(false)} />
                {
                    isLoading ?
                        <CircularProgress height={2} />
                        :
                        <CustomButton type="submit" label='Pay now' disabled={!stripe} loading={isPaymentLoading} />
                }
                {
                    message &&
                    <Typography
                        size="subtitle2"
                        weight="Light"
                        align="center"
                        color="red"
                    >
                        {message}
                    </Typography>


                }
            </Stack>
        </StyledForm>
    )
};