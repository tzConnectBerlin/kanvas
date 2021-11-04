import styled from '@emotion/styled';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import Typography from '../../design-system/atoms/Typography';
import PageWrapper from '../../design-system/commons/PageWrapper';

import { Stack } from '@mui/material';
import { useParams } from 'react-router';
import { useMutation } from '@apollo/client';
import { IUser } from '../../interfaces/user';
import { Animated } from 'react-animated-css';
import { FC, useEffect, useState } from 'react';
import { UPDATE_USER } from '../../api/mutations/user';
import { REGISTER_USER } from '../../api/queries/user';
import { useHistory, useLocation} from 'react-router-dom';
import { ProfileForm } from '../../design-system/molecules/ProfileForm';


interface AcccountProps {
    signedPayload?: string;
    user?: IUser;   
}

interface ParamTypes {
    status: "create" | "edit"
}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const useUrl = () => new URLSearchParams(useLocation().search);

const getInitialValues = () => ({
    firstName: sessionStorage.getItem('firstName') ?? '',
    lastName: sessionStorage.getItem('lastName') ?? '',
    organisation: sessionStorage.getItem('organisation') ?? '',
    userName: sessionStorage.getItem('userName') ?? '',
    bio: sessionStorage.getItem('bio') ?? '',
    address: sessionStorage.getItem('userAddress') ?? '',
    profilePicture: sessionStorage.getItem('profilePicture') ?? '',
    instagramLink: sessionStorage.getItem('instagramLink') ?? '',
    twitterLink: sessionStorage.getItem('twitterLink') ?? '',
    websiteLink: sessionStorage.getItem('websiteLink') ?? '',
    linkedinLink: sessionStorage.getItem('linkedinLink') ?? '',
    facebookLink: sessionStorage.getItem('facebookLink') ?? '',
    discordLink: sessionStorage.getItem('discordLink') ?? '',
})

const Account : FC<AcccountProps> = ({...props}) => {

    const query = useUrl();
    const { status } = useParams<ParamTypes>()
    const [initialValues, setInitialValues] = useState(getInitialValues())

    const history = useHistory()
    const location = useLocation<{currentUser: IUser}>()

    const [updateUser, updateUserResponse] = useMutation(UPDATE_USER);
    const [registerUser, registerUserResponse] = useMutation(REGISTER_USER);

    useEffect(() => {
        if (registerUserResponse.data) {
            sessionStorage.clear()
            history.push(`/profile/${registerUserResponse.data.registerUser.userName}`)
        }
    }, [registerUserResponse.data])

    useEffect(() => {
        if (updateUserResponse.data) {
            history.push(`/profile/${updateUserResponse.data.updateUser.userName}`)
        }
    }, [updateUserResponse.data])

    useEffect(() => {
        if (status === 'edit' ) {
            setInitialValues({
                firstName: location.state?.currentUser?.firstName ?? '',
                lastName: location.state?.currentUser?.lastName ?? '',
                organisation: location.state?.currentUser?.organisation ?? '',
                userName: location.state?.currentUser?.userName ?? '',
                bio: location.state?.currentUser?.bio ?? '',
                address: location.state?.currentUser?.address ?? '',
                profilePicture: location.state?.currentUser?.profilePicture ?? '',
                instagramLink: location.state?.currentUser?.instagramLink ?? '',
                twitterLink: location.state?.currentUser?.twitterLink ?? '', 
                websiteLink: location.state?.currentUser?.websiteLink ?? '',
                linkedinLink: location.state?.currentUser?.linkedinLink ?? '',
                facebookLink: location.state?.currentUser?.facebookLink ?? '',
                discordLink: location.state?.currentUser?.discordLink ?? '',
            })
        }
    }, [])

    return (
        <PageWrapper>
            <StyledStack direction="column">
                <FlexSpacer minHeight={10} />
                
                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                    <Typography size="h1" weight='SemiBold'> { status.charAt(0).toUpperCase() + status.slice(1)} your profile </Typography>
                </Animated>
                <Typography size="h2" weight='Light' color={'#C4C4C4'}> No worries, you will be all set</Typography>
                <Typography size="h2" weight='Light' color={'#C4C4C4'}> In one single click. </Typography>
                    
                <FlexSpacer minHeight={6} />

                <ProfileForm instagramCode={query.get("code")} twitterOauthToken={query.get('oauth_token')} twitterOauthVerifier={query.get('oauth_verifier')} initialValues={initialValues} submit={status === 'edit' ? updateUser : registerUser} loading={registerUserResponse.loading || updateUserResponse.loading} signedPayload={props.signedPayload} update={status === 'edit'}/>
            </StyledStack>
        </PageWrapper>
    )
}

export default Account;