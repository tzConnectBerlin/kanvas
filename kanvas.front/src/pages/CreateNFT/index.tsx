import styled from '@emotion/styled';
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import PageWrapper from "../../design-system/commons/PageWrapper";

import { FC } from 'react';
import { Stack } from '@mui/material';
import { Animated } from "react-animated-css";
import { Typography } from "../../design-system/atoms/Typography";
import { CreatNFTForm } from "../../design-system/organismes/CreateNFTForm";

interface CreateNFTProps {

}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const CreateNFT : FC<CreateNFTProps> = () => {



    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>

                <FlexSpacer minHeight={12} />

                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                    <Typography size="h1" weight='SemiBold' sx={{justifyContent: 'center'}}> Create an NFT</Typography>
                </Animated>

                <FlexSpacer minHeight={2} />

                <CreatNFTForm/>
            </StyledStack>
        </PageWrapper>
    )
}


export default CreateNFT;