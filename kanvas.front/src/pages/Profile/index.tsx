import styled from '@emotion/styled';
import Tabs from '../../design-system/molecules/Tabs';
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import Typography from '../../design-system/atoms/Typography';
import PageWrapper from '../../design-system/commons/PageWrapper';

import { toast } from 'react-toastify';
import { Animated } from 'react-animated-css';
import { FC, useEffect, useState } from 'react';
import { Box, Stack, Theme } from '@mui/material';
import { GET_USER } from '../../api/queries/user';
import { useHistory, useParams } from 'react-router';
import { useLazyQuery, useMutation } from "@apollo/client";
import { CustomButton } from '../../design-system/atoms/Button';
import { GET_USER_CREATIONS, GET_USER_GALLERY } from '../../api/queries/artwork';
import { ArtworkCard } from '../../design-system/molecules/ArtworkCard/ArtworkCard';
import { HeaderProfile } from '../../design-system/molecules/HeaderProfile/HeaderProfile';
import { EDIT_USER_CREATION_LAYOUTS, EDIT_USER_GALLERY_LAYOUTS } from '../../api/mutations/user';
import NftGrid from '../../design-system/organismes/NftGrid';

interface ParamTypes {
    username: string;
    tab: string;
}

interface ProfileProps {
    
}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const StyledButtonWrapper = styled.div`
    justify-content: center;
    display: flex;
`

const StyledAnimated = styled(Animated)<{display: boolean}>`
    display: ${props => props.display ? 'initial' : 'none'};
    height: auto;
`   

const StyledDiv = styled.div<{editionMode?: boolean}>`
    max-height: ${props => props.editionMode ? '265px' : '400px'};
    min-height: ${props => props.editionMode ? '265px' : '330px'};;
    transition: max-height 0.5s, min-height 0.5s;

    
    @media (max-width: 650px) {
        padding-top: 2rem;
        padding-left: 2rem;
        padding-right: 2rem;
    }
`

const Profile : FC<ProfileProps> = () => {
    
    let { username } = useParams<ParamTypes>();
    let { tab } = useParams<ParamTypes>();
    
    const history = useHistory()

    const [selectedTab, setSelectedTab] = useState('Gallery')
    const [emptyMessage, setEmptyMessage] = useState(tab)
    const [emptyLink, setEmptyLink] = useState(tab)

    // Getting user info and updating
    const [getUser, user] = useLazyQuery(GET_USER)
    const [getUserGallery, gallery] = useLazyQuery(GET_USER_GALLERY)
    const [getUserCreations, creations] = useLazyQuery(GET_USER_CREATIONS)

    // Editing layouts
    const [editUserGalleryLayouts, editUserGalleryLayoutsResponse] = useMutation(EDIT_USER_GALLERY_LAYOUTS);
    const [editUserCreationLayouts, editUserCreationLayoutsResponse] = useMutation(EDIT_USER_CREATION_LAYOUTS);

    const [assets, setAssets] = useState<[JSX.Element] | []>([])

    // Edition conditions for the gallery
    const [layouts, setLayouts] = useState<any>()
    const [editionMode, setEditionMode] = useState(false)
    
    // Fill coordinate to give a proper display when no layouts set
    const fillCoordinateInMatrix = (elements: any[], maxColumn: number) => {
        const layouts = [];
        let counter = 0;

        for (let _row = 0; _row < elements.length / maxColumn; _row++) {
            for (let _column = 0; _column < maxColumn ; _column++) {
                layouts.push({
                    i: counter.toString(),
                    x: _column,
                    y: _row,
                    w: 1,
                    h: 1,
                    static: true
                })
                counter ++
            }
        }

        // Taking out the element that are not supposed to be here
        layouts.splice(elements.length, layouts.length)
        return layouts
    }

    useEffect(() => {
        const savedLayouts = localStorage.getItem("rgl-8")
        
        if (savedLayouts) {
            const parsed = JSON.parse(savedLayouts)
            setLayouts(parsed)
        } else {
            setLayouts({lg: fillCoordinateInMatrix([0,1,2,3,4], 3), md: fillCoordinateInMatrix([0,1,2,3,4], 2), sm: fillCoordinateInMatrix([0,1,2,3,4], 2), xs: fillCoordinateInMatrix([0,1,2,3,4], 1), xxs: fillCoordinateInMatrix([0,1,2,3,4], 1)})
        }

        if (username) {
            getUser({variables: { userName: username }})
            getUserGallery({variables: { userName: username, skip: 0 }})
        }
    }, [username])

    const switchGridMode = (staticElement: boolean) => {
        const copyLayouts = JSON.parse(JSON.stringify(layouts));

        const newLayouts = {
            lg: copyLayouts.lg.map( (element: any) => {
                element.static = staticElement
                return element
            }),
            md: copyLayouts.md.map( (element: any) => {
                element.static =  staticElement
                return element
            }),
            sm: copyLayouts.sm.map( (element: any) => {
                element.static =  staticElement
                return element
            }),
            xs: copyLayouts.xs.map( (element: any) => {
                element.static =  staticElement
                return element
            }),
            xxs: copyLayouts.xxs.map( (element: any) => {
                element.static =  staticElement
                return element
            })
        }
        
        setLayouts(newLayouts)
    }

    const cancelEdition = () => {
        setEditionMode(false)
        switchGridMode(true)
    }

    // Handle switch tabs and new data coming in
    useEffect(() => {
        if (gallery.data?.getUserGallery && user.data?.getUser) {
            
            // Create the assets to give to the grid
            let assets = gallery.data.getUserGallery.map((asset: any) => {
                return <ArtworkCard 
                            url={asset.url} 
                            artistName={asset.creator.firstName + ' ' + asset.creator.lastName}
                            // TODO adapt based on the new data structure from backend
                            drop={{startDate: undefined, price: undefined}}
                            auction={asset.auctions[0] ?? {endDate: undefined, startingPrice: undefined}}
                            fixedPrice={{price: undefined}}
                        />
            } )

            setAssets(assets)

            if (user.data.getUser.galleryLayouts) {
                setLayouts(JSON.parse(user.data.getUser.galleryLayouts))
            } else {
                const lgLayouts = fillCoordinateInMatrix(gallery.data.getUserGallery, 3)
                const mdSmLayouts = fillCoordinateInMatrix(gallery.data.getUserGallery, 2)
                const xssLayouts = fillCoordinateInMatrix(gallery.data.getUserGallery, 1)
                setLayouts({lg: lgLayouts, md: mdSmLayouts, sm: mdSmLayouts, xs: xssLayouts, xxs: xssLayouts})
            }
        } if ((!gallery.loading && !gallery.data) || (gallery.data?.getUserGallery && gallery.data?.getUserGallery.length === 0 && user.data?.getUser)) {
            setAssets([])
            setEmptyMessage('Empty Gallery')
            setEmptyLink('Click to browse artworks')
        }
    }, [gallery])

    useEffect(() => {
        if (creations.data?.getUserCreations && user.data?.getUser) {
            
            // Create the assets to give to the grid
            let assets = creations.data.getUserCreations.map((asset: any) => {
                return <ArtworkCard 
                            url={asset.url} 
                            artistName={asset.creator.firstName + ' ' + asset.creator.lastName}
                            // TODO adapt based on the new data structure from backend
                            drop={{startDate: undefined, price: undefined}}
                            auction={asset.auctions[0] ?? {endDate: undefined, startingPrice: undefined}}
                            fixedPrice={{price: undefined}}
                        />
            } )

            setAssets(assets)

            if (user.data.getUser.creationLayouts) {
                setLayouts(JSON.parse(user.data.getUser.creationLayouts))
            } else {
                const lgLayouts = fillCoordinateInMatrix(creations.data.getUserCreations, 3)
                const mdSmLayouts = fillCoordinateInMatrix(creations.data.getUserCreations, 2)
                const xssLayouts = fillCoordinateInMatrix(creations.data.getUserCreations, 1)
                setLayouts({lg: lgLayouts, md: mdSmLayouts, sm: mdSmLayouts, xs: xssLayouts, xxs: xssLayouts})
            }
            
        } if ((!gallery.loading && !creations.data) || (creations.data?.getUserCreations && creations.data?.getUserCreations.length === 0 && user.data?.getUser)) {
            setAssets([])
            setEmptyMessage('Empty Creations')
            setEmptyLink('Click to create an artwork')
        }
    }, [creations])

    const handleSwitchTab = (newValue: number) => {
        switch(newValue) {
            // Gallery
            case 1: 
                getUserGallery({variables: { userName: username, skip: 0 }})
                setSelectedTab('Gallery')
                break;
            // Creations
            case 2:
                getUserCreations({variables: { userName: username, skip: 0 }});
                setSelectedTab('Creations')
                break;
            default:
                getUserGallery({variables: { userName: username, skip: 0 }})
                setSelectedTab('Gallery')
                break;
        }
    }


    // Save layouts sections 
    const saveGalleryLayouts = () => {
        editUserGalleryLayouts({variables: {userName: username, galleryLayouts: JSON.stringify(layouts)}})
            .then(result => {
                setLayouts(JSON.parse(result.data.editUserGalleryLayouts.galleryLayouts))
                setEditionMode(false);
            })
            .catch(error => {
                toast.error('There was a problem saving your new layouts', {position: toast.POSITION.TOP_RIGHT})
                console.log(error)
                setEditionMode(false);
            })
    }

    const saveCreationLayouts = () => {
        editUserCreationLayouts({variables: {userName: username, creationLayouts: JSON.stringify(layouts)}})
            .then(result => {
                setLayouts(JSON.parse(result.data.editUserCreationLayouts.creationLayouts))
                setEditionMode(false);
            })
            .catch(error => {
                toast.error('There was a problem saving your new layouts', {position: toast.POSITION.TOP_RIGHT})
                setEditionMode(false);
            })
    }

    const handleSaveLayouts = () => {
        setSaveLayouts(false);
        if (selectedTab === 'Gallery') {
            saveGalleryLayouts()
        } else if (selectedTab === 'Creations') {
            saveCreationLayouts()
        }
    }

    const [saveLayouts, setSaveLayouts] = useState(false)

    // useEffect hook to make sure that the layouts saved are static 
    useEffect(() => {
        if (saveLayouts && layouts.lg[0].static) {
            handleSaveLayouts()
        }
    }, [layouts, saveLayouts])

    // Edit profile section

    const editProfile = () => {
        if (user.data?.getUser) {
            const currentUser = user.data?.getUser
            history.push({
                pathname: '/account/edit',
                state: { currentUser }
            })
        } 
    }

    return (
        <PageWrapper>
            <StyledStack direction='column'>

                <FlexSpacer minHeight={10} />
                
                <StyledDiv editionMode={editionMode}>
                    <StyledAnimated animationIn="fadeIn" animationOut="fadeOut" isVisible={editionMode} display={editionMode}>
                        <Typography size="h1" weight='Bold'> Edit your gallery </Typography>
                        <Typography size="h3" weight='Light' color={'#C4C4C4'}> Drag and drop items to reorganize them the way</Typography>
                        <Typography size="h3" weight='Light' color={'#C4C4C4'} sx={{marginBottom: '2rem'}}> you want and hold the arrow to resize. </Typography>
                    </StyledAnimated>
                    
                    <StyledAnimated animationIn="fadeIn" animationOut="fadeOut" isVisible={true} display={!editionMode}>
                        <HeaderProfile user={user.data?.getUser} loading={user.loading} editProfile={editProfile}/>
                    
                        <FlexSpacer minHeight={4} />
                    
                        <Tabs tabs={[{
                                label: 'Gallery',
                                value: 1
                            },{
                                label: 'Creations',
                                value: 2
                            }]}
                            handleValueChange={handleSwitchTab}/>
                    </StyledAnimated>
                </StyledDiv>
                <FlexSpacer minHeight={2} />
                
                {
                    // If current user is the same as the user page
                    localStorage.getItem('Kanvas - address') === user.data?.getUser?.userName ?
                        editionMode ?
                            <StyledButtonWrapper>
                                <CustomButton size="medium" textSize="Light" primary={false} label={'Back'} onClick={()=> { cancelEdition(); }} />
                                <FlexSpacer minWidth={4} />
                                <CustomButton size="medium" textSize="Light" primary={false} label={'Save'} loading={editUserGalleryLayoutsResponse.loading || editUserCreationLayoutsResponse.loading} onClick={()=> {switchGridMode(true); setSaveLayouts(true)}} />
                            </StyledButtonWrapper>
                        :
                            <StyledButtonWrapper>
                                {
                                    assets && assets.length > 0 ?
                                        <CustomButton size="medium" textSize="Light" primary={false} label={'Edit gallery'} onClick={()=> { setEditionMode(true); switchGridMode(false);  }} />
                                    :
                                        undefined
                                }
                            </StyledButtonWrapper>
                    :
                        undefined
                }

                {
                    layouts ?
                        <NftGrid editable={editionMode} layouts={layouts} setLayouts={setLayouts} assets={assets} emptyMessage={emptyMessage} emptyLink={emptyLink} loading={gallery.loading || creations.loading} />
                    :
                        selectedTab === 'Gallery' && gallery.error ?
                            <Box sx={{justifyContent: 'center', width: '100%'}}>
                                <Stack direction='column' sx={{alignItems: 'center'}}>
                                    <Typography size="h2" weight='Light' color="#C4C4C4" sx={{marginBottom: '0.5rem'}}> Oops something wrong happened </Typography>
                                    <Typography size="body" weight='Light' color="#e77f52" type='link'> Refresh the page </Typography>
                                </Stack>
                            </Box>
                        :
                            selectedTab === 'Creations' && creations.error ?
                                <Box sx={{justifyContent: 'center', width: '100%'}}>
                                    <Stack direction='column' sx={{alignItems: 'center'}}>
                                        <Typography size="h2" weight='Light' color="#C4C4C4" sx={{marginBottom: '0.5rem'}}> Oops something wrong happened </Typography>
                                        <Typography size="body" weight='Light' color="#e77f52" type='link'> Refresh the page </Typography>
                                    </Stack>
                                </Box>
                            :
                                undefined    
                }

            </StyledStack>
        </PageWrapper>
    )
}

export default Profile;