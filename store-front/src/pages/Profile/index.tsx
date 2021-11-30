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
    userAddress: string
    tab?: string
}

interface ProfileProps {}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const StyledAnimated = styled(Animated)`
    display: 'initial';
    height: auto;

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

const Profile: FC<ProfileProps> = () => {
    let { userAddress } = useParams<ParamTypes>()

    const history = useHistory()

    // Using the useState hook in case adding more tabs in the future
    const [selectedTab, setSelectedTab] = useState('Collection')

    const [userResponse, getUser] = useAxios(
        {
            url:
                process.env.REACT_APP_API_SERVER_BASE_URL +
                `/users`,
            withCredentials: true,
        },
        { manual: true },
    )

    const [userNftsResponse, getUserNfts] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/filter`,
            withCredentials: true,
        },
        { manual: true },
    )

    useEffect(() => {
        if (!userAddress) {
            history.push('/404')
        }

        getUser({
            params: {
                userAddress: userAddress,
            },
        })
        getUserNfts({
            params: {
                address: userAddress,
                pagesize: 12,
            },
        })
    }, [])

    const handleSwitchTab = (newValue: number) => {
        switch (newValue) {
            // Collection
            case 1:
                setSelectedTab('Collection')
                break
            default:
                setSelectedTab('Collection')
                break
        }
    }

    useEffect(() => {
        if (userResponse.error?.code === '404') {
            history.push('/404')
        }
    }, [userResponse])

    // Edit profile section
    const editProfile = () => {
        if (userResponse.data?.user) {
            const currentUser = {
                userName: userResponse.data?.user.userName,
                profilePicture: userResponse.data?.user.profilePicture,
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
                            user={userResponse.data?.user}
                            loading={userResponse.loading}
                            editProfile={editProfile}
                            nftsCount={userResponse.data?.nftCount}
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
                    loading={userNftsResponse.loading}
                    nfts={userNftsResponse.data?.nfts}
                    emptyMessage={'No Nfts in collection yet'}
                    emptyLink={'Click here to buy some in the store.'}
                />
            </StyledStack>
        </PageWrapper>
    )
}

export default Profile
