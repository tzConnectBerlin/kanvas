import styled from '@emotion/styled'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'

import { FC, useEffect, useState } from 'react'
import { Stack } from '@mui/material'
import { Animated } from 'react-animated-css'
import { Typography } from '../../design-system/atoms/Typography'
import { ProfileForm } from '../../design-system/organismes/ProfileForm'
import { useLocation } from 'react-router'
import { IUser } from '../../interfaces/user'

interface EditProfileProps {}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const getInitialValues = () => ({
    name: sessionStorage.getItem('name') ?? '',
    profilePicture: sessionStorage.getItem('profilePicture') ?? '',
})

export const EditProfile: FC<EditProfileProps> = () => {
    const [initialValues, setInitialValues] = useState<{
        name: string
        profilePicture: string
    }>({
        name: '',
        profilePicture: '',
    })
    const location = useLocation<{ currentUser: IUser }>()

    useEffect(() => {
        setInitialValues({
            name: location.state?.currentUser?.name ?? '',
            profilePicture: location.state?.currentUser?.profilePicture ?? '',
        })
    }, [])

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>
                <FlexSpacer minHeight={12} />

                <Animated
                    animationIn="fadeIn"
                    animationOut="fadeOut"
                    isVisible={true}
                >
                    <Typography
                        size="h1"
                        weight="SemiBold"
                        sx={{
                            paddingLeft: '2rem',
                            paddingRight: '2rem',
                            justifyContent: 'center',
                        }}
                    >
                        Edit your profile
                    </Typography>
                </Animated>

                <FlexSpacer minHeight={2} />

                <ProfileForm
                    initialValues={initialValues}
                    submit={() => {}}
                    loading={false}
                />
            </StyledStack>
        </PageWrapper>
    )
}
