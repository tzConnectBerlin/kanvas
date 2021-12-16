import { t } from 'i18next';
import { FC, useState } from 'react';
import { Animated } from 'react-animated-css';
import { Stack, Step, StepLabel, Stepper, Theme, useMediaQuery } from '@mui/material';

import styled from '@emotion/styled';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';
import Typography from '../../design-system/atoms/Typography';
import CustomButton from '../../design-system/atoms/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface CheckoutProps {

}

const StyledChevronLeftIcon = styled(ChevronLeftIcon)`
    margin-left: -0.5rem;
`

const StyledStepper = styled(Stepper)<{ theme?: Theme }>`
    .MuiStepIcon-text {
        fill: white !important;
    }

    .MuiSvgIcon-root.Mui-active {
        color: ${props => props.theme.palette.primary.contrastText} !important;
    }
    `

const StyledStep = styled(Step)<{ theme?: Theme, previousStepValid: boolean }>`
    .MuiStepConnector-line {
        border-color: ${props => props.previousStepValid ? props.theme.palette.primary.contrastText : "#c4c4c4"} !important;
        transition: color 0.2s;
    }
`

const StyledStepLabel = styled(StepLabel) <{ theme?: Theme }>`
    .MuiSvgIcon-root.Mui-completed {
        color: ${props => props.theme.palette.primary.contrastText} !important;
    }
`

const steps = [
    'Summary',
    'Choose payment method',
    'Proceed payment',
];

export const Checkout: FC<CheckoutProps> = ({ ...props }) => {
    const isMobile = useMediaQuery('(max-width: 874px)');

    const [title, setTitle] = useState<string>('Sumarry')

    const [activeStep, setActiveStep] = useState<number>(0)

    const handleStepBack = () => {

    }

    return (
        <PageWrapper>
            <Stack direction="column" spacing={3} style={{ width: '100%' }}>
                <FlexSpacer minHeight={isMobile ? 6 : 10} />

                <Stack direction="row" style={{ width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <CustomButton
                        size='small'
                        onClick={handleStepBack}
                        label={t('checkout.back_button')}
                        style={{ position: 'absolute', left: 0 }}
                        icon={<StyledChevronLeftIcon />}
                        disabled={activeStep === 0}
                    />
                    <FlexSpacer />
                    <Animated
                        animationIn="fadeIn"
                        animationOut="fadeOut"
                        isVisible={true}
                    >
                        <Typography
                            fontSize='3.5rem'
                            weight="SemiBold"
                            sx={{ justifyContent: 'center' }}
                        >
                            {title}
                        </Typography>
                    </Animated>


                    <FlexSpacer />
                </Stack>

                <FlexSpacer />

                <StyledStepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label, index) => (
                        <StyledStep previousStepValid={index < activeStep + 1} key={label}>
                            <StyledStepLabel>{label}</StyledStepLabel>
                        </StyledStep>
                    ))}
                </StyledStepper>


            </Stack>

            {/* Stepper */}

            {/* Step 1: Summary */}
            {/* Cart inside paper */}
            {/* Step 2: Choose payment method */}

            {/* Step 3: Process to payment */}

            {/* Success with summary and nice animation */}

            {/* Button validate step or go bvack to profile */}
        </PageWrapper>
    )
}