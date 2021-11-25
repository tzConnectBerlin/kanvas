import useAxios from 'axios-hooks'
import styled from '@emotion/styled'
import Tabs from '../../design-system/molecules/Tabs'
import NftGrid from '../../design-system/organismes/NftGrid'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import PageWrapper from '../../design-system/commons/PageWrapper'

import { Stack } from '@mui/material'
import { IUser } from '../../interfaces/user'
import { Animated } from 'react-animated-css'
import { FC, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { HeaderProfile } from '../../design-system/molecules/HeaderProfile/HeaderProfile'

interface ParamTypes {
    username: string
    tab: string
}

interface ProfileProps { }

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const StyledAnimated = styled(Animated)`
    display: 'initial';
    height: auto;
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;

    @media (max-width: 650px) {
        padding-left: 0rem !important;
        padding-right: 0rem !important;
    }
`

const StyledDiv = styled.div`
    transition: max-height 0.5s, min-height 0.5s;

    @media (max-width: 650px) {
        padding-top: 2rem;
    }
`

const mockUser: IUser = {
    profilePicture: '',
    name: 'Tristan Nicolaides',
    userName: 'tristan_ncl',
    address: 'tz1KhMoukVbwDXRZ7EUuDm7K9K5EmJSGewxd',
    createdAt: new Date(),
}

const mokeNft = [
    {
        id: 4,
        name: 'first_nft',
        ipfsHash: '',
        price: 10,
        dataUri:
            'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
        metadata: {
            key2: 'value1',
            test: 'hey',
        },
        dataUrl: 'heyyy',
        contract: 'contract_address',
        tokenId: 'teojteojt',
    },
    {
        id: 3,
        name: 'second_nft',
        ipfsHash: '',
        dataUri:
            'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
        price: 12,
        metadata: {
            key2: 'value1',
            test: 'hey',
        },
        dataUrl: 'heyyy',
        contract: 'contract_address',
        tokenId: 'teojteojt',
    },
    {
        id: 4,
        name: 'third_nft',
        ipfsHash: '',
        dataUri:
            'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
        price: 10,
        metadata: {
            key2: 'value1',
            test: 'hey',
        },
        dataUrl: 'heyyy',
        contract: 'contract_address',
        tokenId: 'teojteojt',
    },
    {
        id: 3,
        name: 'fourth_nft',
        ipfsHash: '',
        dataUri:
            'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
        price: 12,
        metadata: {
            key2: 'value1',
            test: 'hey',
        },
        dataUrl: 'heyyy',
        contract: 'contract_address',
        tokenId: 'teojteojt',
    },
    {
        id: 3,
        name: 'fourth_nft',
        ipfsHash: '',
        dataUri:
            'https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg',
        price: 12,
        metadata: {
            key2: 'value1',
            test: 'hey',
        },
        dataUrl: 'heyyy',
        contract: 'contract_address',
        tokenId: 'teojteojt',
    },
]

const Profile: FC<ProfileProps> = () => {
    let { username } = useParams<ParamTypes>()
    let { tab } = useParams<ParamTypes>()

    const history = useHistory()

    const [selectedTab, setSelectedTab] = useState('Gallery')
    const [emptyMessage, setEmptyMessage] = useState(tab)
    const [emptyLink, setEmptyLink] = useState(tab)

    const [user, getUser] = useAxios({
        url: process.env.REACT_APP_API_SERVER_BASE_URL + '/',
        withCredentials: true
    })

    // Getting user info and updating
    // const [getUser, user] = useLazyQuery(GET_USER)
    // const [getUserGallery1, gallery] = useLazyQuery(GET_USER_GALLERY)

    useEffect(() => {
        if (username) {
            getUser({
                params: {
                    userName: username,
                },
            })
        }
    }, [username])

    const handleSwitchTab = (newValue: number) => {
        switch (newValue) {
            // Gallery
            case 1:
                setSelectedTab('Collection')
                break
            // Activity might only be personnal - no one else would see that than log user
            // case 2:
            //     setSelectedTab('Activity')
            //     break;
            default:
                setSelectedTab('Collection')
                break
        }
    }

    // Edit profile section
    const editProfile = () => {
        if (user.data) {
            const currentUser = {
                userName: 'Tristan',
                profilePicture: '',
            }
            history.push({
                pathname: '/profile/edit',
                state: { currentUser },
            })
        }
    }

    return (
        <PageWrapper>
            <StyledStack direction="column">
                <FlexSpacer minHeight={10} />

                <StyledDiv>
                    <StyledAnimated
                        animationIn="fadeIn"
                        animationOut="fadeOut"
                        isVisible={true}
                    >
                        <HeaderProfile
                            user={mockUser}
                            loading={user.loading}
                            editProfile={editProfile}
                        />

                        <FlexSpacer minHeight={2} />

                        <Tabs
                            tabs={[
                                {
                                    label: 'Collection',
                                    value: 1,
                                },
                            ]}
                            handleValueChange={handleSwitchTab}
                        />
                    </StyledAnimated>
                </StyledDiv>
                <FlexSpacer minHeight={2} />

                <NftGrid
                    open={false}
                    nfts={mokeNft}
                    emptyMessage={'No Nfts in collection yet'}
                    emptyLink={'Click here to buy some in the store.'}
                    loading={user.loading}
                />
            </StyledStack>
        </PageWrapper>
    )
}

export default Profile
