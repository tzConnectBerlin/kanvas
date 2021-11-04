import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import Typography from '../../atoms/Typography';
import FlexSpacer from "../../atoms/FlexSpacer";
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import InstagramIcon from '@mui/icons-material/Instagram';

import { FC, useState } from 'react';
import { FiCopy } from 'react-icons/fi';
import { SiDiscord } from 'react-icons/si';
import { Skeleton, Stack, Theme } from '@mui/material';
import { IUser } from '../../../interfaces/user';
import { CustomButton } from '../../atoms/Button';
import { FaLinkedinIn, FaFacebookF } from 'react-icons/fa';
import { Animated } from 'react-animated-css';


interface HeaderProfileProps {
    user: IUser;
    loading: boolean;
    theme?: Theme;
    editProfile: Function;
}

const FiCopyStyled = styled(FiCopy)<{theme?: Theme, loading: boolean}>`
    color: ${props => props.loading ? '#C4C4C4' : props.theme.palette.text.primary};
    cursor: ${props => props.loading ? '' : 'pointer'};

`

const StyledPictureStack = styled(Stack)`
    /* justify-content: center; */
    align-items: center;
    position: relative;
    min-height: 195px;

    @media (max-width: 650px) {
        position: absolute;
        margin-right: 2rem;
    }
`

const LinkWrapper = styled.a<{theme?: Theme, display?: boolean}>`

    cursor: pointer;

    filter: ${props => props.theme.dropShadow.default};
    background: ${props => props.theme.button.background } ;
    transition: filter 0.2s, width 0.3s;

    width: 32px;
    height: 32px;

    border-radius: 2rem;

    display: flex;
    align-items: center;
    justify-content: center;


    margin-top: 0.3rem !important;

    &:hover {
        transition: filter 0.2s;
        filter: ${props => props.theme.dropShadow.hover};
    }

    &:active {
        transition: filter 0.2s, border 0.2s;
        filter: drop-shadow(0px 0px 6px #98989833);
    }
`

const StyledDiscordIcon = styled(SiDiscord)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1rem;
    width: 1rem;
`

const StyledTwitterIcon = styled(TwitterIcon)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1rem;
    width: 1rem;
`

const StyledInstagramIcon = styled(InstagramIcon)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1rem;
    width: 1rem;
`

const StyledFaLinkedinIn = styled(FaLinkedinIn)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1rem;
    width: 1rem;
`

const StyledFaFacebookF = styled(FaFacebookF)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1rem;
    width: 1rem;
`

const StyledLanguageIcon = styled(LanguageIcon)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
    height: 1rem;
    width: 1rem;
`

const StyledTypography = styled(Typography)`
    -webkit-box-align: start;
`

const MobileLinksStack = styled(Stack)`
    display: none;
    margin-top: 1rem;

    @media (max-width: 650px) {
        display: flex;
    }
`

const DesktopLgLinksStack = styled(Stack)`

    align-items: center;
    margin-bottom: 0;

    @media (max-width: 1100px) {
        display: none;
    }
`

const DesktopMdLinksStack = styled(Stack)`
    margin-bottom: 1.2rem;

    @media (min-width: 1100px) {
        display: none;
    }
`

const AddressStack = styled(Stack)`
    display: flex;
    position: absolute;
    bottom: 0;

    @media (max-width: 650px) {
        display: none;
    }
`

const MobileWrapperStack = styled(Stack)`
    display: none;

    padding-bottom: 3rem;
    border-bottom: 1px solid #C4C4C4;

    @media (max-width: 650px) {
        display: flex;
    }
`

const DesktopWrapperStack = styled(Stack)`
    display: flex;
    width: 100%;

    @media (max-width: 650px) {
        display: none;
    }
`

const StyledAnimated = styled(Animated)`
    display: flex;
    justify-content: center;

`

export const HeaderProfile : FC<HeaderProfileProps> = ({...props}) => {

    const [tooltipText, setTooltipText] = useState('')
    const [showCopyOverlay, setShowCopyOverlay] = useState(false);

    const copyAddressToClipBoard = () => {
        try {
            navigator.clipboard.writeText(props.user?.address)

            setTooltipText('Copied !');  // copy succeed.
            setShowCopyOverlay(true)

            setTimeout(() => {setShowCopyOverlay(false)}, 1000);
        } catch (e) {
            setTooltipText('Oops..');  // copy failed.
            setTimeout(() => {setShowCopyOverlay(false)}, 1000);
        }
    }

    return (
        <>
            {/* Desktop version  */}
            <DesktopWrapperStack direction='row' spacing={9}>
                <StyledPictureStack direction='column' spacing={3} sx={{maxWidth: 200}}>
                    <Avatar  src={`${props.user?.profilePicture}?${Date.now()}`} height={150} width={150} loading={props.loading} />
                    <AddressStack direction='row' spacing={2} sx={{maxWidth: 200 ,alignItems: 'center'}}>
                        <Typography size="body" weight='Light' color='#C4C4C4' noWrap={true} align='center' display='initial !important' width='6rem'> { props.loading ? <Skeleton width='5rem'/> : props.user?.address } </Typography>
                        <FiCopyStyled onClick={() => props.loading ? {} : copyAddressToClipBoard()} loading={props.loading} />
                    </AddressStack>
                    <StyledAnimated animationIn="fadeIn" animationOut="fadeOut" isVisible={showCopyOverlay}>
                        <Typography size="body" weight='Light' color='#363636' noWrap={true} align='center' width='6rem' sx={{position: 'absolute', bottom: '-2rem', justifyContent: 'center'}}> { tooltipText } </Typography>
                    </StyledAnimated>
                </StyledPictureStack>

                <Stack direction='column' sx={{width: '100%'}}>
                    <Stack direction='row' spacing={2} sx={{ alignItems: 'center', width: '100%'}}>
                        <Typography size="h2" weight='SemiBold' noWrap={true} align='left' sx={{marginRight: '2rem'}} display='block'> { props.loading ? <Skeleton width='15rem'/> : props.user?.firstName + ' ' + props.user?.lastName } </Typography>
                        {
                            props.loading ?
                                <Skeleton animation="pulse" variant="circular" width='30px' height='30px' />
                            :
                                <DesktopLgLinksStack direction="row" spacing={2} sx={{marginLeft: 0}}>
                                    { props.user?.facebookLink !== '' ? <LinkWrapper href={props.user?.facebookLink} target='_blank' >
                                        <StyledFaFacebookF/>
                                    </LinkWrapper> : undefined }
                                    {false ? <LinkWrapper href={props.user?.linkedinLink} target='_blank'>
                                        <StyledFaLinkedinIn/>
                                    </LinkWrapper> : undefined }
                                    { props.user?.instagramLink !== '' ? <LinkWrapper href={props.user?.instagramLink} target='_blank'>
                                        <StyledInstagramIcon/>
                                    </LinkWrapper> : undefined }
                                    { props.user?.twitterLink !== '' ? <LinkWrapper href={props.user?.twitterLink}  target='_blank'>
                                        <StyledTwitterIcon/>
                                    </LinkWrapper> : undefined }
                                    { props.user?.discordLink ? <LinkWrapper href={props.user?.discordLink}  target='_blank'>
                                        <StyledDiscordIcon/>
                                    </LinkWrapper> : undefined }
                                    { props.user?.websiteLink !== '' ? <LinkWrapper href={props.user?.websiteLink}  target='_blank'>
                                        <StyledLanguageIcon/>
                                    </LinkWrapper> : undefined }
                                </DesktopLgLinksStack>
                        }
                        <FlexSpacer minWidth={0} />

                        {
                            // Here goes validation if user profile is logged in user
                            localStorage.getItem('Kanvas - address') === props.user?.userName ?
                                <CustomButton size="medium" onClick={() => props.editProfile()} label="Edit profile" />
                            :
                                undefined
                        }

                    </Stack>

                    <Typography size="h5" weight='Light' noWrap={true} color='#0088a7' align='left' sx={{marginBottom: '1rem'}}> { props.loading ? <Skeleton width='5rem' /> : `@${props.user?.userName}` } </Typography>

                    {
                        props.loading ?
                            <Skeleton animation="pulse" variant="circular" width='30px' height='30px' />
                        :
                            <DesktopMdLinksStack direction="row" spacing={2} sx={{marginLeft: 0}}>
                                { props.user?.facebookLink !== '' ? <LinkWrapper href={props.user?.facebookLink} target='_blank' >
                                    <StyledFaFacebookF/>
                                </LinkWrapper> : undefined }
                                {false ? <LinkWrapper href={props.user?.linkedinLink} target='_blank'>
                                    <StyledFaLinkedinIn/>
                                </LinkWrapper> : undefined }
                                { props.user?.instagramLink !== '' ? <LinkWrapper href={props.user?.instagramLink} target='_blank'>
                                    <StyledInstagramIcon/>
                                </LinkWrapper> : undefined }
                                { props.user?.twitterLink !== '' ? <LinkWrapper href={props.user?.twitterLink}  target='_blank'>
                                    <StyledTwitterIcon/>
                                </LinkWrapper> : undefined }
                                { props.user?.discordLink ? <LinkWrapper href={props.user?.discordLink}  target='_blank'>
                                    <StyledDiscordIcon/>
                                </LinkWrapper> : undefined }
                                { props.user?.websiteLink !== '' ? <LinkWrapper href={props.user?.websiteLink}  target='_blank'>
                                    <StyledLanguageIcon/>
                                </LinkWrapper> : undefined }
                            </DesktopMdLinksStack>
                    }

                    <StyledTypography size="body1" weight='Light' color='#9b9b9b' truncate={true} align='left' width={400} sx={{ alignItems: 'left'}}> { props.user?.bio } </StyledTypography>

                    <FlexSpacer minHeight={1} />

                    <Stack direction='row' spacing={2} >
                        <Typography size="body1" weight='Medium'  align='left'> { props.loading ? <Skeleton animation="pulse" variant="circular" width='12px' height='12px' /> : 0 } </Typography>
                        <Typography size="body1" weight='Light' color='#C4C4C4' truncate={true} align='left'> Artworks </Typography>

                        <Typography size="body1" weight='Medium'  align='left' sx={{marginLeft: '3rem !important'}}> { props.loading ? <Skeleton animation="pulse" variant="circular" width='12px' height='12px' /> : 0 } </Typography>
                        <Typography size="body1" weight='Light' color='#C4C4C4' truncate={true} align='left'> Followers </Typography>

                        <Typography size="body1" weight='Medium'  align='left' sx={{marginLeft: '3rem  !important'}}> { props.loading ? <Skeleton animation="pulse" variant="circular" width='12px' height='12px' /> : 0 } </Typography>
                        <Typography size="body1" weight='Light' color='#C4C4C4' truncate={true} align='left'> Followings </Typography>
                    </Stack>
                </Stack>
            </DesktopWrapperStack>

            {/* Mobile Version */}
            <MobileWrapperStack direction='column'>
                <Stack direction='row' sx={{marginBottom: '2rem', paddingBottom: 2, borderBottom: '1px solid #C4C4C4' }}>
                    <StyledPictureStack direction='column' spacing={3} sx={{maxWidth: 200}}>
                        <Avatar  src={props.user?.profilePicture} height={170} width={170} loading={props.loading} responsive={true}/>
                    </StyledPictureStack>

                    <Stack direction='column' sx={{ width: '100%', alignItems: 'end'}}>
                        <Typography fontSize={'1.8rem'} weight='SemiBold' noWrap={true} align='right' display='block' sx={{width: '60%'}}> { props.loading ? <Skeleton width='15rem'/> : props.user?.firstName + ' ' + props.user?.lastName } </Typography>
                        <Typography size="h5" weight='Light' noWrap={true} color='#0088a7' align='right' sx={{marginBottom: '1.5rem'}}> { props.loading ? <Skeleton width='5rem' /> : `@${props.user?.userName}` } </Typography>

                        {
                            props.loading ?
                                undefined
                            :
                                <CustomButton size="small" onClick={() => {}} label="Edit profile" />
                        }

                        <FlexSpacer minHeight={1}/>

                        {
                            props.loading ?
                                <Skeleton animation="pulse" variant="circular" width='34px' height='34px' />
                            :
                                <MobileLinksStack direction='row' spacing={2}>
                                    <LinkWrapper display={props.user?.facebookLink !== ''} href={props.user?.facebookLink} target='_blank' >
                                        <StyledFaFacebookF/>
                                    </LinkWrapper>
                                    <LinkWrapper display={props.user?.linkedinLink !== ''} href={props.user?.linkedinLink} target='_blank'>
                                        <StyledFaLinkedinIn/>
                                    </LinkWrapper>
                                    <LinkWrapper display={props.user?.instagramLink !== ''} href={props.user?.instagramLink}  target='_blank'>
                                        <StyledInstagramIcon/>
                                    </LinkWrapper>
                                    <LinkWrapper display={props.user?.twitterLink !== ''} href={props.user?.twitterLink}  target='_blank'>
                                        <StyledTwitterIcon/>
                                    </LinkWrapper>
                                    <LinkWrapper display={props.user?.discordLink !== ''} href={props.user?.discordLink}  target='_blank'>
                                        <StyledDiscordIcon/>
                                    </LinkWrapper>
                                    <LinkWrapper display={props.user?.websiteLink !== ''} href={props.user?.websiteLink}  target='_blank'>
                                        <StyledLanguageIcon/>
                                    </LinkWrapper>
                                </MobileLinksStack>
                        }
                    </Stack>
                </Stack>

                {
                    props.loading ?
                            <>
                                <Skeleton animation="pulse" width='234px' />
                                <Skeleton animation="pulse" width='134px' />
                                <Skeleton animation="pulse" width='64px' sx={{marginBottom: '1rem'}}/>
                            </>
                        :
                            <>
                                <Typography size="body1" weight='SemiBold'  align='left' sx={{marginBottom: '1rem  !important'}}> Bio </Typography>
                                <StyledTypography size="body1" weight='Light' color='#9b9b9b' truncate={true} align='left' width={'100%'} sx={{alignItems: 'left', marginBottom: '2rem  !important'}}> { props.user?.bio } </StyledTypography>
                            </>
                }

                <Stack direction='row'>
                    <Stack direction='column' spacing={1}>
                        <Typography size="body1" weight='Medium'  align='left' > { props.loading ? <Skeleton animation="pulse" variant="circular" width='14px' height='14px' sx={{marginBottom: '0.5rem'}} /> : 0 } </Typography>
                        <Typography size="body1" weight='Light' color='#C4C4C4' truncate={true} align='left'> Artworks </Typography>
                    </Stack>
                    <FlexSpacer/>
                    <Stack direction='column' spacing={1}>
                        <Typography size="body1" weight='Medium'  align='left' > { props.loading ? <Skeleton animation="pulse" variant="circular" width='14px' height='14px' sx={{marginBottom: '0.5rem'}} /> : 0 } </Typography>
                        <Typography size="body1" weight='Light' color='#C4C4C4' truncate={true} align='left'> Followers </Typography>
                    </Stack>
                    <FlexSpacer/>
                    <Stack direction='column' spacing={1}>
                        <Typography size="body1" weight='Medium'  align='left' > { props.loading ? <Skeleton animation="pulse" variant="circular" width='14px' height='14px' sx={{marginBottom: '0.5rem'}} /> : 0 } </Typography>
                        <Typography size="body1" weight='Light' color='#C4C4C4' truncate={true} align='left'> Followings </Typography>
                    </Stack>
                </Stack>

            </MobileWrapperStack>
        </>
    )
}