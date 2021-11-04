import styled from '@emotion/styled';
import Avatar from '../../design-system/atoms/Avatar';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import Typography from '../../design-system/atoms/Typography';
import PageWrapper from "../../design-system/commons/PageWrapper";

import { FC } from 'react';
import { Stack, Theme } from '@mui/material';
import { Animated } from 'react-animated-css';
import { INotification, NotificationEnum } from '../../interfaces/notification';
import { useHistory } from 'react-router-dom';

interface NotificationsProps {
    notifications: INotification[];
}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const StyledNotificationStack = styled(Stack)<{theme?: Theme}>`
    cursor: pointer;
    
    height: 5.5em;
    
    padding-left: 0.875em;
    margin-top: 1rem;
    margin-bottom: 1rem;

    border-left: 2px solid ${props => props.theme.palette.background.paper};

    :hover {
        border-left: 2px solid ${props => props.theme.palette.primary.contrastText};
    }
`

const UnreadIndicator = styled.div<{theme?: Theme}>`
    height: 0.8rem;
    width: 0.8rem;

    border-radius: 1rem;
    background-color: ${props => props.theme.palette.primary.contrastText};
`

const StyledMediumSpan = styled.span`
    font-family: 'Poppins Medium';
    
    :hover {
        text-decoration: underline;
    }
`

const StyledLightSpan = styled.span`
    font-family: 'Poppins Light';
`

const Notifications : FC<NotificationsProps> = ({...props}) => {
    const history = useHistory();
    
    const navigateTo = (path: string) => {
        history.push(path)
    }

    const getTimeInfo = (notificationDate: Date) : string => {
        const now = new Date();

        const difference = now.getTime() - notificationDate.getTime()

        if (difference < 60000) {
            return 'Just now'
        } else if (difference > 60000 && difference < 3600000) {
            return `${ Math.round(difference/60000) } minutes ago`
        } else if (difference > 3600000 && difference < 86400000) {
            return `${Math.round(difference/3600000) } hours ago`
        } else if (difference > 86400000) {
            return `${Math.round(difference/86400000)} days ago`
        }

        return ''
    }

    const getAvatarRadius = (type: NotificationEnum): number => {
        switch (type) {
            case NotificationEnum.FOLLOWING:
                return 75
            case NotificationEnum.NFT_CREATION:
                return 0
            case NotificationEnum.NFT_GOT_SOLD:
                return 0
            case NotificationEnum.NFT_RECEIVE_BID:
                return 0
            case NotificationEnum.NEW_NFT_FROM_FOLLOWING:
                return 0
            case NotificationEnum.FOLLOWING_CREATED_AUCTION:
                return 0
            case NotificationEnum.FOLLOWING_CREATED_DROP:
                return 0
            case NotificationEnum.FOLLOWING_CREATED_FIXED_PRICE:
                return 0
            case NotificationEnum.OUTBID:
                return 0
            case NotificationEnum.WON_AUCTION:
                return 0
            case NotificationEnum.NEW_NFT:
                return 0
            default:
                return 75
        }
    }

    const createDescription = (notification: INotification): JSX.Element => {
        switch (notification.type) {
            case NotificationEnum.FOLLOWING:
                return <Typography size="h4" weight="Medium"  sx={{cursor: 'pointer', display: 'block !important' }} onClick={() => navigateTo(`/profile/${notification.concernedUser.userName}`)}> 
                            <StyledMediumSpan> { notification.concernedUser.firstName + ' ' + notification.concernedUser.lastName + ' ' }</StyledMediumSpan>
                            
                            <StyledLightSpan> { notification.description } </StyledLightSpan>
                            
                        </Typography>
                            
            case NotificationEnum.NFT_CREATION:
                return <Stack direction="row" spacing={0.7}>
                            <Typography size="h4" weight="Medium" sx={{cursor: 'pointer'}} type='link' onClick={() => navigateTo(``)}> { '"' + notification.concernedNft?.title + '"' } </Typography>
                            <Typography size="h4" weight="Light" sx={{cursor: 'pointer'}}> { notification.description } </Typography>
                        </Stack>
            case NotificationEnum.NFT_GOT_SOLD:
                return <Stack direction="row" spacing={0.7}>
                            <Typography size="h4" weight="Light" sx={{cursor: 'pointer', display: 'block !important'}}> 
                                <StyledLightSpan> Your artwork </StyledLightSpan>
                                <StyledMediumSpan> { ' "' + notification.concernedNft?.title + '" ' } </StyledMediumSpan>
                                <StyledLightSpan> got sold for { notification.saleInfo!.price + notification.saleInfo!.currency } to </StyledLightSpan>
                                <StyledMediumSpan> { notification.concernedUser.firstName + ' ' + notification.concernedUser.lastName } </StyledMediumSpan>
                                <StyledLightSpan> { 'you received ' + notification.saleInfo!.sellerPrice + notification.saleInfo!.currency + '.' } </StyledLightSpan>
                            </Typography>
                            
            
                        </Stack>
            case NotificationEnum.NFT_RECEIVE_BID:
                return <Stack direction="row" spacing={0.7}>
                            <Typography size="h4" weight="Medium" sx={{cursor: 'pointer'}} type='link' onClick={() => navigateTo(``)}> { '"' + notification.concernedNft?.title + '"' } </Typography>
                            <Typography size="h4" weight="Light" sx={{cursor: 'pointer'}}> { notification.description } </Typography>
                        </Stack>
            case NotificationEnum.NEW_NFT_FROM_FOLLOWING:
                return ( <>
                    
                    </>)
            case NotificationEnum.FOLLOWING_CREATED_AUCTION:
                return ( <>
                    
                    </>)
            case NotificationEnum.FOLLOWING_CREATED_DROP:
                return ( <>
                    
                    </>)
            case NotificationEnum.FOLLOWING_CREATED_FIXED_PRICE:
                return ( <>
                    
                    </>)
            case NotificationEnum.OUTBID:
                return ( <>
                    
                    </>)
            case NotificationEnum.WON_AUCTION:
                return ( <>
                    
                    </>)
            case NotificationEnum.NEW_NFT:
                return ( <>
                    
                    </>)
            default:
                return ( <>
                    
                    </>)
        }
    }

    return (
        <PageWrapper>
            <StyledStack>
                <FlexSpacer minHeight={10} />
                    
                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                    <Typography size="h1" weight='SemiBold'> Notifications </Typography>
                </Animated>

                <FlexSpacer minHeight={4} />

                <Stack direction="column" >
                    {
                        props.notifications.map((notification: INotification) => 
                            <StyledNotificationStack direction="row" spacing={6} sx={{alignItems: 'center'}}>
                                <Avatar src={notification.type === NotificationEnum.FOLLOWING ? notification.concernedUser.profilePicture : notification.concernedNft?.url} height={75} width={75} borderRadius={getAvatarRadius(notification.type)}/>
                                <Stack direction="column" sx={{justifyContent: 'center'}}>
                                    {
                                        createDescription(notification)
                                    }
                                    <Typography size="body2" weight="Light"  color={'#e77f52'} sx={{cursor: 'pointer'}}> { getTimeInfo(notification.date) } </Typography>
                                </Stack>
                                <FlexSpacer/>
                                
                                {
                                    notification.read ?
                                        undefined
                                    :
                                        <UnreadIndicator/>
                                }
                            </StyledNotificationStack>
                        )
                    }
                </Stack>

            </StyledStack>
        </PageWrapper>
    )
}

export default Notifications;