import styled from '@emotion/styled';
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import PageWrapper from "../../design-system/commons/PageWrapper";
import { FC } from 'react';
import { Grid, Stack } from '@mui/material';
import { CreatNFTForm } from "../../design-system/organismes/CreateNFTForm";
import { Link } from 'react-router-dom';
import { Animated } from "react-animated-css";
import Typography from '../../design-system/atoms/Typography';
import { CustomButton } from '../../design-system/atoms/Button';
import { useTranslation } from 'react-i18next';


interface NotFoundProps {

}

const LinkStyled = styled(Link)`
    transition: 0.2s;
    position: absolute;
    top: 0;
    align-items: center;
`
const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const StyledGrid = styled(Grid)`
    transition: all 0.2s;
    width: 100%;
    max-width: none !important;
    flex-basis: 100% !important;
    margin: 0;
    padding: -1.5rem;
    text-align: center;
`

const NotFound: FC<NotFoundProps> = () => {
    const { t } = useTranslation(['translation']);

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>

                <FlexSpacer minHeight={12} />

                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                    <Typography size="h1" weight='SemiBold' sx={{ justifyContent: 'center' }}> 404</Typography>

                    <FlexSpacer minHeight={6} />

                    <Typography size="h2" weight="Light" style={{ justifyContent: 'center' }}>Page not found</Typography>

                    <FlexSpacer minHeight={1} />

                    <Typography size="body" weight="Light" style={{ justifyContent: 'center' }}>Sorry, we cannot find the page {`you're `}looking for</Typography>

                    <FlexSpacer minHeight={4} />

                    <StyledGrid>
                        <CustomButton size="large" label={t('common.button.backToHome')} href="/" sx={{ mx: 'auto', maxWidth: '20rem' }} />
                    </StyledGrid>
                </Animated>

                <FlexSpacer minHeight={2} />

            </StyledStack>
        </PageWrapper>
    )
}


export default NotFound;