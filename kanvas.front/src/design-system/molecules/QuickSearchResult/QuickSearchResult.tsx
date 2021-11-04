import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import FlexSpacer from '../../atoms/FlexSpacer';

import { FC } from 'react';
import { useHistory } from 'react-router';
import { CustomButton } from '../../atoms/Button';
import { Typography } from '../../atoms/Typography';
import { EmptySearchResult } from '../../atoms/EmptySearchResult';
import {  BoxProps as MBoxProps, Box, Paper, Grid, Skeleton, Stack, Theme } from '@mui/material';

interface QuickSearResultProps {
    profilesSearchResult: any;
    artworksSearchResult: any;
    tagsSearchResult: any;
    searchString: string | unknown;
    open?: boolean;
    closeResult: Function;
}

interface BoxProps extends MBoxProps {
    open?: boolean;
}

const StyledBox = styled(Box)<BoxProps>`
    display: ${props => props.open ? 'flex' : 'none'};
`

const StyledPaper = styled(Paper)<{theme?: Theme}>`
    box-shadow: none;
    border-radius: 0;

    outline: ${props => `solid 1px ${props.theme.palette.text.primary}`};

    :hover {
        outline: ${props => `solid 2px ${props.theme.palette.text.primary}`};
    }

    transition: height 0.3s;
    background-color: ${props => props.theme.palette.background.paper};
    background-image: none;

`

const StyledHeaderStack = styled(Stack)`
    padding: 1em 1.5em;
    margin-bottom: 0.5em;
`

const StyledContentStack = styled(Stack)`
    padding-top: 0.5em;
    padding-left: 1em;
    padding-bottom: 0.5em;
`

const ProfileResultWrapper = styled(Stack)<{theme?: Theme}>`
    display: flex;
    align-items: center;
    padding-left: 0.875em;
    margin-right: 1em !important;
    height: 4.5em;
    cursor: pointer;

    border-left: 2px solid ${props => props.theme.palette.background.paper};

    .MuiSkeleton-root {
        transform: scale(1)
    }

    &:hover {
        border-left: 2px solid ${props => props.theme.palette.primary.contrastText};
    }
`

const StyledGrid = styled(Grid)`
    padding-right: 1.5em;
`

export const QuickSearchResult : FC<QuickSearResultProps> = ({...props}) => {

    const history = useHistory()

    const navigateTo = (userName: string) => {
        props.closeResult()
        history.push(`/profile/${userName}`)
    }

    return (
        <StyledBox
            open={props.open}
            sx={{
                flexWrap: 'wrap',
                position:'absolute',
                '& > :not(style)': {
                    m: 1,
                    transition: 'height 0.3s',
                    width: '90vw',
                    maxWidth: '35rem',
                    height: 'auto',
                    marginTop: '1.2em',
                    margin: 0,
                    paddingBottom: '1.5em',
                    paddingTop: '0.2em'
                },
            }}
        >
            <StyledPaper >
                {/* Check if we only got errors and it is not loading from the api in which case we display the empty content */}
                {
                    props.profilesSearchResult.error && !props.profilesSearchResult.loading && props.artworksSearchResult.error && !props.artworksSearchResult.loading && props.tagsSearchResult.error && !props.tagsSearchResult.loading ?
                        <EmptySearchResult searchString={props.searchString}/>
                    :
                        undefined
                }
                {
                    props.profilesSearchResult.loading ?
                        <>
                            <StyledHeaderStack direction='row'>
                                <Typography size="h4" weight="SemiBold"> Profiles </Typography>
                            </StyledHeaderStack>
                            <StyledContentStack spacing={1}>
                                {
                                    [{},{},{}].map( () =>
                                        <ProfileResultWrapper direction="row" spacing={4} >
                                            <Skeleton animation="wave" variant="circular" width={65} height={65} />
                                            <Skeleton animation="wave" height={14} width="50%" sx={{borderRadius: 2}}/>
                                        </ProfileResultWrapper>
                                    )
                                }
                            </StyledContentStack>
                        </>
                    :
                        !props.profilesSearchResult.called || props.profilesSearchResult.error ?
                            undefined
                        :
                            <>
                                <StyledHeaderStack direction='row'>
                                    <Typography size="h4" weight="SemiBold"> Profiles </Typography>
                                    <FlexSpacer/>
                                    <Typography size="inherit" weight="Light" color="#0088a7 !important" sx={{cursor: 'pointer'}}> See all </Typography>
                                </StyledHeaderStack>
                                <StyledContentStack spacing={1}>
                                    {
                                        props.profilesSearchResult.data?.getUsersSearch.map( (profile: any, index: number) =>
                                            <ProfileResultWrapper key={index + Date.now()} direction="row" spacing={5} onClick={() => navigateTo(profile.userName)}>
                                                <Avatar src={`${profile.profilePicture}?${Date.now()}`} height={65} width={65} />
                                                <Stack direction="column">
                                                    <Typography size="h4" weight="Medium" sx={{cursor: 'pointer'}}> { profile.firstName + ' ' + profile.lastName } </Typography>
                                                    <Typography size="body2" weight="Light" color={'#0088a7'} sx={{cursor: 'pointer'}}> @{ profile.userName } </Typography>
                                                </Stack>
                                            </ProfileResultWrapper>
                                        )
                                    }
                                </StyledContentStack>
                            </>
                }
                {
                    props.artworksSearchResult.loading ?
                        <>
                            <StyledHeaderStack direction='row'>
                                <Typography size="h4" weight="SemiBold"> Artworks </Typography>
                            </StyledHeaderStack>
                            <StyledContentStack spacing={1}>
                                {
                                    [{},{},{}].map( () =>
                                        <ProfileResultWrapper direction="row" spacing={4}>
                                            <Skeleton animation="wave" width={65} height={65} sx={{borderRadius: 0}} />
                                            <Skeleton animation="wave" height={14} width="50%" sx={{borderRadius: 2}}/>
                                        </ProfileResultWrapper>
                                    )
                                }
                            </StyledContentStack>
                        </>
                    :
                        !props.artworksSearchResult.called || props.artworksSearchResult.error ?
                            undefined
                        :
                            <>
                                <StyledHeaderStack direction='row'>
                                    <Typography size="h4" weight="SemiBold"> Artworks </Typography>
                                    <FlexSpacer/>
                                    <Typography size="inherit" weight="Light" color="#0088a7 !important" sx={{cursor: 'pointer'}}> See all </Typography>
                                </StyledHeaderStack>
                                <StyledContentStack spacing={1}>
                                    {
                                        props.artworksSearchResult.data?.getArtworksSearch.map( (artwork: any) =>
                                            <ProfileResultWrapper direction="row" spacing={5}>
                                                <Avatar src={artwork.url}  height={65} width={65} borderRadius={0} />
                                                <Typography size="h4" weight="Medium" sx={{cursor: 'pointer'}}> { artwork.title } </Typography>
                                            </ProfileResultWrapper>
                                        )
                                    }

                                </StyledContentStack>
                            </>
                }
                {
                    props.tagsSearchResult.loading ?
                        <>
                            <StyledHeaderStack direction='row'>
                                <Typography size="h4" weight="SemiBold"> Tags </Typography>
                            </StyledHeaderStack>
                            <StyledContentStack sx={{marginLeft: '1em'}}>
                                <StyledGrid container spacing={2}>
                                    {
                                        [{},{},{}].map( () =>
                                            <Grid item>
                                                <Skeleton animation="wave" height={40} width={140} sx={{transform: 'scale(1)', borderRadius: 5}}/>
                                            </Grid>
                                        )
                                    }
                                </StyledGrid>
                            </StyledContentStack>
                        </>
                    :
                        !props.tagsSearchResult.called || props.tagsSearchResult.error ?
                            undefined
                        :

                            <>
                                <StyledHeaderStack direction='row'>
                                    <Typography size="h4" weight="SemiBold"> Tags </Typography>
                                    <FlexSpacer/>
                                    <Typography size="inherit" weight="Light" color="#0088a7 !important" sx={{cursor: 'pointer'}}> See all </Typography>
                                </StyledHeaderStack>
                                <StyledContentStack sx={{marginLeft: '1em'}}>
                                    <StyledGrid container spacing={2}>
                                        {
                                            props.tagsSearchResult.data?.getTagsSearch ?
                                                props.tagsSearchResult.data?.getTagsSearch.map( (tag: any) =>
                                                    <Grid item>
                                                        <CustomButton size="medium" textSize="Light" primary={false} label={tag.name}/>
                                                    </Grid>
                                                )
                                            :
                                                props.tagsSearchResult.data?.getTagsSuggestions.map( (tag: any) =>
                                                    <Grid item>
                                                        <CustomButton size="medium" textSize="Light" primary={false} label={tag.name}/>
                                                    </Grid>
                                                )

                                        }
                                    </StyledGrid>
                                </StyledContentStack>
                            </>
                }
            </StyledPaper>
        </StyledBox>
    )
}