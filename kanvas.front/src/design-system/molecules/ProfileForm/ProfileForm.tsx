
import * as yup from 'yup';
import Scroll from 'react-scroll';
import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import CustomButton from '../../atoms/Button';
import Typography from "../../atoms/Typography";
import FlexSpacer from '../../atoms/FlexSpacer';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import InstagramIcon from '@mui/icons-material/Instagram';
import CustomCircularProgress from '../../atoms/CircularProgress';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';

import { useFormik } from 'formik';
import { useLazyQuery } from '@apollo/client';
import { FC, useEffect, useState } from "react";
import { ClearRounded } from '@mui/icons-material';
import { DropZone } from '../../molecules/DropZone';
import { Badge, FormHelperText, Theme } from '@mui/material';
import { FaLinkedinIn, FaFacebookF, FaDiscord } from 'react-icons/fa';
import { CHECK_IF_USERNAME_VALID } from '../../../api/search';
import { GET_INSTAGRAM_USER_INFO, GET_TWITTER_ACCESS_TOKENS, GET_TWITTER_USER_INFO } from '../../../api/instagram';
import { Box, TextField, InputAdornment, Stack } from '@mui/material';

interface ProfileFormProps {
    instagramCode: string | null;
    twitterOauthToken: string | null;
    twitterOauthVerifier: string | null;
    initialValues: any;
    submit: Function;
    loading: boolean;
    signedPayload?: string;
    update: boolean;
}

const ariaLabel = { 'aria-label': 'description', 'error': 'error' };

const StyledStack = styled(Stack)`
    width: 55%;

    transition: all 0.2s;

    .MuiTextField-root {
        width: 100% !important;
    }

    @media (max-width: 1100px) {
        width: 80%;
    }

    @media (max-width: 650px) {
        width: 100%;
    }
`

const StyledInput = styled(TextField)<{theme?: Theme}>`
    .MuiInput-input {
        padding: 4px 0 8px !important;   
    }

    .MuiInput-root:after {
        border-bottom: 2px solid ${props => props.theme.palette.primary.contrastText };
    }

    .MuiFormHelperText-root {
        font-family: 'Poppins Medium';
        font-size: 0.9rem;
        margin-top: 2.5rem !important;

        position: absolute;
    }
`

const StyledFormHelperText = styled(FormHelperText)`
    font-family: 'Poppins Medium';
    font-size: 0.9rem;
    margin-top: 0.4rem !important;
    text-align: right;
`

const StyledInstagramIcon = styled(InstagramIcon)<{theme?: Theme, verified?: boolean}>`
    color: ${props => props.verified ? props.theme.palette.background.default : props.theme.palette.text.primary};
    margin-right: 0.5rem;
    height: 20px;
`

const StyledTwitterIcon = styled(TwitterIcon)<{theme?: Theme, verified?: boolean}>`
    color: ${props => props.verified ? props.theme.palette.background.default : props.theme.palette.text.primary};
    margin-right: 0.5rem;
    height: 20px;
`

const StyledLanguageIcon = styled(LanguageIcon)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1.2rem;
    width: 1.2rem;
    margin-right: 0.5rem;
`

const StyledFacebookIcon = styled(FaFacebookF)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1.2rem;
    width: 1.2rem;
    margin-right: 0.5rem;
`

const StyledLinkedinIcon = styled(FaLinkedinIn)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1.2rem;
    width: 1.2rem;
    margin-right: 0.5rem;
`

const StyledDiscordIcon = styled(FaDiscord)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1.2rem;
    width: 1.2rem;
    margin-right: 0.5rem;
`

interface StyledProgressDivProps {
    completed: boolean;
    theme?: Theme;
}

const StyledProgressDiv = styled.div<StyledProgressDivProps>`
    width: 5rem;
    height: 0.15rem;

    background-color: ${props => props.completed ? props.theme.palette.primary.contrastText : "#C4C4C4"};
    transition: background-color 200ms linear;
`

const StyledAvataWrapper = styled.div`
    position: relative;
    
`

const ClearContentWrapper =  styled.div<{theme?: Theme}>`
    height: 2rem;
    width: 2rem;

    border-radius: 1rem;
    position: absolute;
    right: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    z-index: 5;

    background-color: ${props => props.theme.palette.background.default};

    margin-right: 0.5rem;
    margin-top: 0.5 rem;

    filter: ${props => props.theme.dropShadow.default};
    transition: filter 0.2s;

    cursor: pointer;

    :hover {
        transition: filter 0.2s;
        filter: ${props => props.theme.dropShadow.hover};
    }

    :active {
        filter: drop-shadow(0px 0px 6px #98989833);
    }
`

const StyledClearContent = styled(ClearRounded)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
`

const StyledVerifiedRoundedIcon = styled(VerifiedRoundedIcon)<{theme?: Theme}>`
    border-radius: 2rem;
    border: 4px solid ${props => props.theme.palette.background.default};
    background-color: ${props => props.theme.palette.background.default};
    color: ${props => props.theme.palette.text.primary};

    margin-bottom: 0.2rem;
    margin-right: 0.4rem;

    height: 1.2rem;
    width: 1.2rem;
`

const validationSchema = yup.object({
    firstName: yup
        .string()
        .min(2, 'First name should be of minimum 2 characters length')
        .max(30, 'First name should be of maximum 30 characters length')
        .required('First name is required'),
    lastName: yup
        .string()
        .min(2, 'Last name should be of minimum 2 characters length')
        .max(30, 'Last name should be of maximum 30 characters length')
        .required('Last name is required'),
    userName: yup
        .string()
        .min(3, 'Username must be at least 3 characters length')
        .required('Username is required'),
    bio: yup
        .string()
        .max(350, 'Bio should be of maximum 350 characters length'),
});

let Element  = Scroll.Element;

export const ProfileForm : FC<ProfileFormProps> = ({...props}) => {

    const [profilePicture, setProfilePicture] = useState('')
    const [profilePictureFile, setProfilePictureFile] = useState<unknown>(undefined)
    const [isUserNameValid, setIsUserNameValid] = useState(true)
    const [dropZoneErrorMessage, setDropZoneErrorMessage] = useState<string | null>(null)
    
    const [getInstagramUserInfo, instagramUserInfo] = useLazyQuery(GET_INSTAGRAM_USER_INFO)
    const [getTwitterAccessTokens, twitterAccessTokens] = useLazyQuery(GET_TWITTER_ACCESS_TOKENS)
    const [getTwitterUserInfo, twitterUserInfo] = useLazyQuery(GET_TWITTER_USER_INFO)
    const [checkIfUsernameValid, userNameCheckResponse] = useLazyQuery(CHECK_IF_USERNAME_VALID)
    
    const dataURLtoFile = (dataurl: any, filename: any) => {
 
        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
            
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new File([u8arr], filename, {type:mime});
    }

    const formik = useFormik({
        initialValues: props.initialValues,
        validationSchema: validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => { 
    
            props.update ?
                props.submit({variables: {...values, profilePicture: dataURLtoFile(JSON.parse(sessionStorage.getItem('profilePicture')!).blob, 'profilePicture')}})
            :
                props.submit({variables: {...values, role: 'collector', signedDartPayload: props.signedPayload}})
        },
    });

    // useEffect for profilepicture initial values in case of refresh
    useEffect(() => {
        if (props.instagramCode) {
            instagramUserInfo.loading = true;    
            getInstagramUserInfo({variables: { code:props.instagramCode }})
        }

        if (sessionStorage.getItem('profilePicture') !== null) {
            try {
                const blobJson = JSON.parse(sessionStorage.getItem('profilePicture')!)

                if ('blob' in blobJson) {
                    setProfilePicture(blobJson.blob)
                }
            } catch (error) { 
                console.log(error)
            }
        }

    }, [])

    useEffect(() => {
        if (instagramUserInfo.data) {
            formik.setFieldValue('instagramLink', instagramUserInfo.data.getInstagramUserInfo.instagramLink)
            sessionStorage.setItem('instagramLink', instagramUserInfo.data.getInstagramUserInfo.instagramLink)
        }
    }, [instagramUserInfo.data])

    useEffect(() => {
        formik.setFieldValue('profilePicture', profilePicture)
    }, [profilePicture])

    // useEffect for username verification
    useEffect(() => {
        
        if (formik.values.userName.length >= 3) {
            userNameCheckResponse.loading = true
            
            const delayUserNameAvailabilitySearch = setTimeout(() => {
                checkIfUsernameValid({ variables: { userName: formik.values.userName}})
            }, 800)
             
            return () => { clearTimeout(delayUserNameAvailabilitySearch) }
        }
    }, [formik.values.userName])

    useEffect(() => {
        
        if (userNameCheckResponse.data) {
            setIsUserNameValid(userNameCheckResponse.data.checkIfUsernameValid)
        }

    }, [userNameCheckResponse.data])

    // useEffect for twitter verification

    useEffect(() => {
        if (twitterAccessTokens.data && twitterAccessTokens.data.getTwitterOAuthToken?.oauth_token_twitter) {
            window.location.href = `https://api.twitter.com/oauth/authorize?${twitterAccessTokens.data.getTwitterOAuthToken?.oauth_token_twitter.toString()}`
        }
    }, [twitterAccessTokens.data])

    useEffect(() => {
        if (props.twitterOauthToken !== null && props.twitterOauthVerifier !== null && formik.values.twitterLink === '') {
            twitterUserInfo.loading = true
            getTwitterUserInfo({variables: { oauthToken: props.twitterOauthToken, oauthVerifier: props.twitterOauthVerifier}})
        }
        
    }, [props.twitterOauthToken])
    
    useEffect(() => {
        if (twitterUserInfo.data) {
            formik.setFieldValue('twitterLink', twitterUserInfo.data.getTwitterUserInfo.twitterLink)
            sessionStorage.setItem('twitterLink', twitterUserInfo.data.getTwitterUserInfo.twitterLink)
        }
    }, [twitterUserInfo.data])

    const scrollTo = (id: string) => {
        Scroll.scroller.scrollTo(id, {
            duration: 500,
            delay: 0,
            smooth: true,
            offset: -550
        })
    }

    const handleTwitterClick = () => {
        if (formik.values.twitterLink !== '') {
            formik.setFieldValue('twitterLink', ''); 
            sessionStorage.setItem('twitterLink', '')
        }  else {
            getTwitterAccessTokens() 
        }
    }

    return (
        <Box
            component="form"
            autoComplete="off"
        >
            <form onSubmit={formik.handleSubmit} >
                <StyledStack direction="row" >
                    <StyledStack direction="column" spacing={4}>
                        <Typography size="h3" weight='Medium'> First name* </Typography>
                        <Element name='firstName'>
                            <StyledInput
                                id='firstName'
                                name='firstName'
                                variant="standard"
                                placeholder="Type Here" 
                                autoFocus
                                onFocus={() => scrollTo('firstName')}
                                onBlur={formik.handleBlur}
                                onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('firstName', event.currentTarget.value) }}
                                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                helperText={formik.touched.firstName && formik.errors.firstName}
                                value={formik.values.firstName}
                            />
                        </Element>
                    </StyledStack>
                    <FlexSpacer minWidth={2}/>
                    <StyledStack direction="column" spacing={4}>
                        <Typography size="h3" weight='Medium'> Last name* </Typography>
                        <Element name='lastName'>
                            <StyledInput
                                id='lastName'
                                name='lastName'
                                variant="standard"
                                placeholder="Type Here" 
                                onFocus={() => scrollTo('lastName')}
                                onBlur={formik.handleBlur}
                                onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('lastName', event.currentTarget.value) } }
                                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                helperText={formik.touched.lastName && formik.errors.lastName}
                                value={formik.values.lastName}
                            />
                        </Element>
                    </StyledStack>
                </StyledStack>
                {/* 
                
                // Organisation field

                <FlexSpacer minHeight={4}/>

                <StyledStack direction="column" spacing={4}>
                    <div>    
                        <Typography size="h3" weight='Medium'> Organisation </Typography>
                        <FlexSpacer minHeight={0.5}/>
                        <Typography size="h5" weight='Light' color="#C4C4C4" > Connect your profile via twitter and instagram, In order to verify it. </Typography>
                    </div>
                    <Element name='organisation'>
                        <StyledInput
                            id='organisation'
                            name='organisation'
                            variant="standard"
                            placeholder="Type Here" 
                            autoFocus
                            onFocus={() => scrollTo('organisation')}
                            onBlur={formik.handleBlur}
                            onChange={formik.handleChange}
                            error={formik.touched.organisation && Boolean(formik.errors.organisation)}
                            helperText={formik.touched.organisation && formik.errors.organisation}
                        />
                    </Element>
                </StyledStack> */}


                {
                    props.update ?
                    undefined
                    :
                        <>
                            <FlexSpacer minHeight={4}/>
                            <StyledStack direction="column" spacing={4}>
                                <Typography size="h3" weight='Medium'> Enter a username* </Typography>
                                <Element name='userName'>
                                    <StyledInput
                                        id='userName'
                                        name='userName' 
                                        placeholder="Type Here"
                                        onFocus={() => scrollTo('userName')}
                                        onBlur={formik.handleBlur}
                                        onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('userName', event.currentTarget.value) }}
                                        variant="standard"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"> @ </InputAdornment>,
                                            endAdornment: <InputAdornment position="start"> { userNameCheckResponse.loading ? <CustomCircularProgress height={1} /> : null  } </InputAdornment>
                                        }}
                                        error={ formik.touched.userName && Boolean(formik.errors.userName) || !isUserNameValid }
                                        helperText={ formik.touched.userName && formik.errors.userName || (!isUserNameValid ? 'Username already taken' : '' ) }
                                        value={formik.values.userName}
                                        />
                                </Element>
                            </StyledStack>
                        </>
                }

                <FlexSpacer minHeight={4}/>

                <StyledStack direction="column" spacing={4}>
                    <Typography size="h3" weight='Medium'> Upload your photo </Typography>
                    <Element name='profilePicture' 
                            onFocus={() => scrollTo('profilePicture')}>
                        <Stack direction="row" spacing={8}>
                            {
                                formik.values.profilePicture ? 
                                    <StyledAvataWrapper>
                                        <ClearContentWrapper onClick={() => formik.setFieldValue('profilePicture', '')}>
                                            <StyledClearContent />
                                        </ClearContentWrapper>
                                        <Avatar src={formik.values.profilePicture} height={176} width={176}/>
                                    </StyledAvataWrapper>
                                :
                                    undefined
                            }
                            <DropZone inputId='profilePicture' fileUrl={profilePicture} setFileUrl={setProfilePicture} setDropZoneErrorMessage={setDropZoneErrorMessage} error={dropZoneErrorMessage ? true : false} />
                        </Stack>
                    </Element>
                </StyledStack>
                
                <FlexSpacer minHeight={1}/>
                
                <Typography size="body1" weight='Light' color='error'> { dropZoneErrorMessage } </Typography>

                <FlexSpacer minHeight={3}/>

                <StyledStack direction="column" spacing={4}>
                    <Typography size="h3" weight='Medium'> Enter a short bio* </Typography>
                    <Element name='bio'>
                        <StyledInput
                            id='bio'
                            name='bio'
                            placeholder="Type Here" 
                            variant="standard"
                            inputProps={{
                                maxLength: 350,
                                ariaLabel: 'description'
                            }}
                            onFocus={() => scrollTo('bio')}
                            aria-describedby="bio-helper-text"
                            multiline
                            onChange={formik.values.bio.length >= 350 ? () => {} : (event) => { formik.handleChange(event); sessionStorage.setItem('bio', event.currentTarget.value) }}
                            value={formik.values.bio}
                        />
                    </Element>
                    <StyledFormHelperText id="bio-helper-text">{formik.values.bio.length}/350</StyledFormHelperText>
                </StyledStack>

                <FlexSpacer minHeight={3}/>

                <StyledStack direction="column" spacing={6}>
                    <div>
                        <Element name='verifyProfile'>
                            <Stack direction="row" spacing={4}>
                                <Typography size="h3" weight='Medium'> Verify your Profile </Typography>
                                
                                <Stack direction="row" spacing={0.5} sx={{paddingBottom: '0.4rem', alignItems: 'end'}}>
                                    <StyledProgressDiv completed={formik.values.instagramLink !== '' || formik.values.twitterLink !== ''}/>
                                    <StyledProgressDiv completed={formik.values.instagramLink !== '' && formik.values.twitterLink !== ''}/>
                                </Stack>
                            </Stack>
                            <FlexSpacer minHeight={0.5}/>
                            <Typography size="h5" weight='Light' color="#C4C4C4"> Connect your profile via twitter and instagram, In order to verify it. </Typography>
                        </Element>
                            {
                                twitterAccessTokens.error?.toString()
                            }
                    </div>
                    <Stack direction="row" spacing={4} >  
                        
                        <Badge badgeContent={formik.values.twitterLink !== '' ? <StyledVerifiedRoundedIcon/> : null} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} sx={{ fontSize: '1rem'}}>
                            <CustomButton size="medium" onClick={() => handleTwitterClick()} icon={<StyledTwitterIcon verified={formik.values.twitterLink !== ''}/>} label={formik.values.twitterLink !== '' ? 'Verified via Twitter' : 'Verify via Twitter'} onFocus={() => scrollTo('verifyProfile')} loading={twitterAccessTokens.loading || twitterUserInfo.loading} verified={formik.values.twitterLink !== ''} />
                        </Badge>
                        
                        {
                            formik.values.instagramLink !== '' ?
                                <Badge badgeContent={<StyledVerifiedRoundedIcon/>} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
                                    <CustomButton size="medium" onClick={() => {formik.setFieldValue('twitterLink', ''); sessionStorage.setItem('instagramLink', '')}} icon={<StyledInstagramIcon verified={true}/>} label={'Verified via Instagram'} onFocus={() => scrollTo('verifyProfile')} verified={true} />
                                </Badge>
                            :
                                <CustomButton size="medium" href={`https://api.instagram.com/oauth/authorize?client_id=587300862424190&redirect_uri=https://55945dc34aec.ngrok.io/account&scope=user_profile&response_type=code&state=undefined`} onClick={() => {}}  loading={instagramUserInfo.loading} icon={<StyledInstagramIcon/>} label={'Verify via Instagram'} onFocus={() => scrollTo('verifyProfile')} verified={false} />
                        }
                    </Stack>
                </StyledStack>
                
                <FlexSpacer minHeight={4}/>

                <StyledStack direction="column" spacing={4}>
                    <Typography size="h3" weight='Medium'> Add links to your profile </Typography>
                    <Element name='websiteLinkContainer'>
                        <StyledInput
                            id='websiteLink'
                            name='websiteLink' 
                            placeholder="Type Here" 
                            inputProps={ariaLabel}
                            variant="standard"
                            onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('websiteLink', event.currentTarget.value) }}
                            onFocus={() => scrollTo('websiteLinkContainer')}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"> <StyledLanguageIcon/> </InputAdornment>,
                            }}
                            value={formik.values.websiteLink}
                        />
                    </Element>
                    <Element name='linkedinLinkContainer'>
                        <StyledInput
                            id='linkedinLink'
                            name='linkedinLink' 
                            placeholder="Type Here" 
                            variant="standard"
                            onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('linkedinLink', event.currentTarget.value) }}
                            onFocus={() => scrollTo('linkedinLinkContainer')}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"> <StyledLinkedinIcon/> </InputAdornment>,
                            }}
                            value={formik.values.linkedinLink}
                        />
                    </Element>
                    <Element name='facebookLinkContainer'>
                        <StyledInput
                            id='facebookLink'
                            name='facebookLink' 
                            placeholder="Type Here" 
                            variant="standard"
                            onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('facebookLink', event.currentTarget.value) }}
                            onFocus={() => scrollTo('facebookLinkContainer')}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"> <StyledFacebookIcon/> </InputAdornment>,
                            }}
                            value={formik.values.facebookLink}
                        />
                    </Element>
                    <Element name='discordLinkContainer'>
                        <StyledInput
                            id='discordLink'
                            name='discordLink' 
                            placeholder="Type Here" 
                            variant="standard"
                            onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('discordLink', event.currentTarget.value) }}
                            onFocus={() => scrollTo('discordLinkContainer')}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"> <StyledDiscordIcon/> </InputAdornment>,
                            }}
                            value={formik.values.discordLink}
                        />
                    </Element>
                </StyledStack>

                <FlexSpacer minHeight={5}/>
                
                <CustomButton size="large" onClick={() => formik.handleSubmit()} label={props.update ? 'Save' : 'Register'} sx={{width: '10rem'}} loading={props.loading}/>

                <FlexSpacer minHeight={5}/>
            </form>
        </Box>     
    )
}

