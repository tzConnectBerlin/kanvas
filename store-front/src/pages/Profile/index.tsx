import useAxios from 'axios-hooks';
import styled from '@emotion/styled';
import Tabs from '../../design-system/molecules/Tabs';
import NftGrid from '../../design-system/organismes/NftGrid';
import FlexSpacer from '../../design-system/atoms/FlexSpacer';
import PageWrapper from '../../design-system/commons/PageWrapper';

import { Pagination, Stack, useMediaQuery, useTheme } from '@mui/material';
import { Animated } from 'react-animated-css';
import { FC, useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router';
import { HeaderProfile } from '../../design-system/molecules/HeaderProfile/HeaderProfile';
import { Theme } from '@mui/material';
import { INft } from '../../interfaces/artwork';
import { LensTwoTone } from '@mui/icons-material';

interface ParamTypes {
    userAddress: string;
    tab?: string;
}

interface ProfileProps {}

const StyledStack = styled(Stack)`
    width: 100%;
    max-width: 100rem;
`;

const StyledAnimated = styled(Animated)`
    display: 'initial';
    height: auto;

    @media (max-width: 600px) {
        padding-left: 0rem !important;
        padding-right: 0rem !important;
    }
`;

const StyledDiv = styled.div`
    transition: max-height 0.5s, min-height 0.5s;

    @media (max-width: 600px) {
        padding-top: 2rem;
    }
`;

const StyledPagination = styled(Pagination)<{
    theme?: Theme;
    display: boolean;
}>`
    display: ${(props) => (props.display ? 'flex' : 'none')};

    .MuiPaginationItem-root {
        border-radius: 0;

        font-family: 'Poppins' !important;
    }

    .MuiPaginationItem-root.Mui-selected {
        background-color: ${(props) =>
            props.theme.palette.background.default} !important;
        border: 1px solid ${(props) => props.theme.palette.text.primary} !important;
    }

    nav {
        display: flex;
        align-items: center !important;
    }
`;

const Profile: FC<ProfileProps> = () => {
    let { userAddress } = useParams<ParamTypes>();

    const history = useHistory();

    // Using the useState hook in case adding more tabs in the future
    const [selectedTab, setSelectedTab] = useState('Collection');
    const [userDomain, setUserDomain] = useState('');
    const [userDomainLoading, setUserDomainLoading] = useState(false);

    const [userResponse, getUser] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/profile`,
            withCredentials: true,
        },
        { manual: true },
    );

    const [userNftsResponse, getUserNfts] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts`,
            withCredentials: true,
            params: {
                userAddress: userAddress,
                pageSize: 12,
            },
        },
        { manual: true },
    );

    const [checkPendingNftsResponse, checkPendingNfts] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/nftOwnership`,
            withCredentials: true,
            params: {
                nftIds: []
            },
        },
        { manual: true },
    );

    const fetchPendingNfts = () => {
        if (userNftsResponse.data?.nfts.length > 0) {
            const pendingNfts = userNftsResponse.data.nfts.map((nft: INft) => nft.ownerStatuses?.map(status => status === "pending" ) ? nft : undefined)
            checkPendingNfts({
                url: process.env.REACT_APP_API_SERVER_BASE_URL + `/users/nftOwnership`,
                withCredentials: true,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        'Kanvas - Bearer',
                    )}`,
                },
                params: {
                    nftIds: pendingNfts.map((nft: INft) => nft.id).join(',')
                },
            })

        }
    }

    const updateNFTsStatuses = (newStatuses: any[], nfts: INft[]) => {
        if (newStatuses.length === 0 || nfts.length === 0) return;

        newStatuses.map(nftNewStatuses => {
            nfts.map(nft => {
                if (nft.id === Number(nftNewStatuses.nftId)) {
                    nft.ownerStatuses = nftNewStatuses.ownerStatuses
                }
            })
        })
    }

    // Updating nft state
    useEffect(() => {
        if (checkPendingNftsResponse.data && userNftsResponse.data) {
            updateNFTsStatuses(checkPendingNftsResponse.data, userNftsResponse.data.nfts)
        }
    }, [checkPendingNftsResponse])

    // Calling checking status if any nfts are pending in the profile
    useEffect(() => {
        if(userNftsResponse.data ) {
            if (userNftsResponse.data.nfts.length === 0) return;

            const pendingNfts = userNftsResponse.data.nfts.map((nft: INft) => nft.ownerStatuses?.map(status => status === "pending" ) ? nft : undefined)

            if (pendingNfts.length === 0) return;

            let timer = setInterval(() => {
                fetchPendingNfts()
            }, 2500)

            return () => {
                clearInterval(timer)
            }
        }
    }, [userNftsResponse])

    const loadTezosDomain = async (userAddress: string) => {
        setUserDomainLoading(true)
        const response = await fetch('https://api.tezos.domains/graphql', {
           method:'POST',
           headers:{'content-type':'application/json'},
           body:JSON.stringify({query:`{
            reverseRecords(
              where: {
                address: {
                  in: [
                    "${userAddress}"
                  ]
                }
              }
            ) {
              items {
                address
                owner
                domain {
                  name
                }
              }
            }
          }`})
        })

        const responseBody =  await response.json();
        setTimeout(() => setUserDomainLoading(false), 600);
        setUserDomain(responseBody.data.reverseRecords.items[0].domain.name)
     }

    useEffect(() => {
        window.scrollTo(0, 0);

        if (!userAddress) {
            history.push('/404');
        }

        getUser({
            params: {
                userAddress: userAddress,
            },
        });

        getUserNfts({
            params: {
                userAddress: userAddress,
                pageSize: 12,
            },
        });
    }, []);

    const handleSwitchTab = (newValue: number) => {
        switch (newValue) {
            // Collection
            case 1:
                setSelectedTab('Collection');
                break;
            default:
                setSelectedTab('Collection');
                break;
        }
    };

    useEffect(() => {
        if (userResponse.error?.code === '404') {
            history.push('/404');
        } else {
            loadTezosDomain(userAddress!)
        }
    }, [userResponse]);

    // Edit profile section
    const editProfile = () => {
        if (userResponse.data?.user) {
            const currentUser = {
                userName: userResponse.data?.user.userName,
                profilePicture: userResponse.data?.user.profilePicture,
            };
            history.push({
                pathname: '/profile/edit',
                state: { currentUser },
            });
        }
    };

    const [selectedPage, setSelectedPage] = useState(1);

    const handlePaginationChange = (event: any, page: number) => {
        setSelectedPage(page);

        getUserNfts({
            withCredentials: true,
            params: {
                userAddress: userAddress,
                page: page,
                pageSize: 12,
            },
        });
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <PageWrapper>
            <StyledStack direction="column">
                <FlexSpacer minHeight={isMobile ? 4 : 10} />

                <StyledDiv>
                    <StyledAnimated
                        animationIn="fadeIn"
                        animationOut="fadeOut"
                        isVisible={true}
                    >
                        <HeaderProfile
                            user={userResponse.data?.user}
                            userDomain={userDomain}
                            userDomainLoading={userDomainLoading}
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
                    nftCardMode="user"
                />

                <FlexSpacer minHeight={2} />

                <Stack direction="row">
                    <FlexSpacer />
                    <StyledPagination
                        display={userNftsResponse.data?.numberOfPages > 1}
                        page={selectedPage}
                        count={userNftsResponse.data?.numberOfPages}
                        onChange={handlePaginationChange}
                        variant="outlined"
                        shape="rounded"
                        disabled={
                            userNftsResponse.loading ||
                            userNftsResponse.data?.numberOfPages === 1
                        }
                    />
                </Stack>
                <FlexSpacer minHeight={2} />
            </StyledStack>
        </PageWrapper>
    );
};

export default Profile;
