import useAxios from 'axios-hooks'
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
import { useHistory } from 'react-router-dom';

interface EditProfileProps { }

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

export const EditProfile: FC<EditProfileProps> = () => {

    const history = useHistory()

    const [initialValues, setInitialValues] = useState<{
        userName: string
        profilePicture: string
    }>({
        userName: '',
        profilePicture: '',
    })
    const location = useLocation<{ currentUser: IUser }>()

    const [comfortEditLoader, setComfortEditLoader] = useState(false)

    const [editUserResponse, editUser] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/edit`,
            method: 'POST',
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('Kanvas - Bearer')}`
            }
        },
        { manual: true },
    )

    const [checkIfUsernameValidResponse, checkIfUsernameValid] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/edit/check`,
            method: 'GET',
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('Kanvas - Bearer')}`
            }
        },
        { manual: true },
    )

    useEffect(() => {
        setInitialValues({
            userName: location.state?.currentUser?.userName ?? '',
            profilePicture: location.state?.currentUser?.profilePicture ?? '',
        })
    }, [])

    const handleFormSubmit = (body: any) => {
        setComfortEditLoader(true)

        const data = new FormData()
        data.append('profilePicture', body.profilePicture)
        data.append('userName', body.userName)

        const comfortEditLoader = setTimeout(() => {
            editUser({data: data})

        }, 800)

        return () => {clearTimeout(comfortEditLoader)}
    }

    useEffect(() => {
        setComfortEditLoader(false)

        if (editUserResponse.response?.status === 201) {
            history.push(`/profile/${localStorage.getItem('Kanvas - address')}`)
        }
    }, [editUserResponse])

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
                    submit={handleFormSubmit}
                    checkIfUsernameValidResponse={checkIfUsernameValidResponse}
                    checkIfUserNameValid={checkIfUsernameValid}
                    loading={editUserResponse.loading || comfortEditLoader}
                />
            </StyledStack>
        </PageWrapper>
    )
}
