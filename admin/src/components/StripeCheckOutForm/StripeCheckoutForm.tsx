import styled from '@emotion/styled';
import CustomButton from "../Button";
import CircularProgress from "../CircularProgress";
import Typography from "../Typography";

import { Stack } from "@mui/material";
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { FC, useEffect, useState } from 'react';
import { INft } from '../../Interfaces/artwork';

const StyledForm = styled.form`
    display: flex;
    justify-content: center;

    .Label {
        color: red !important;
    }
`

const StyledPaymentElement = styled(PaymentElement)`
    &.Label {
        color: red !important;
    }
`

interface StripeCheckoutFormProps {
    setNftsInCart: (input: INft[]) => void;
    activeStep: number;
    setActiveStep: Function;
}

export const StripeCheckoutForm: FC<StripeCheckoutFormProps> = ({ ...props }) => {

    const stripe = useStripe();
    const elements = useElements();
    // const elements = stripe!.elements({appearance});

    const [message, setMessage] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);

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
        } else if (error !== undefined) {
            setMessage("An unexpected error occured.");
        }

        if (error === undefined) {
            props.setNftsInCart([])
            props.setActiveStep(props.activeStep + 1)
        }

        setIsPaymentLoading(false)
    };

    return (
        <StyledForm onSubmit={handleSubmit}>
            <Stack direction="column" spacing={4} sx={{ justifyContent: 'center' }}>
                <StyledPaymentElement onReady={() => setIsLoading(false)} />
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