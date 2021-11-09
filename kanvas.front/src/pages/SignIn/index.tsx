import styled from "@emotion/styled";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import PageWrapper from "../../design-system/commons/PageWrapper";

import { toast } from 'react-toastify';
import { KukaiEmbed } from "kukai-embed";
import { SIGN_USER } from '../../api/queries/user';
import { char2Bytes } from "@taquito/utils";
import { Stack, Theme } from "@mui/material";
import { useHistory } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import { Animated } from "react-animated-css";
import { cssTransition } from 'react-toastify';
import { FC, useEffect, useState } from "react";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { setWalletProvider } from "../../contracts/init";
import { CustomButton } from '../../design-system/atoms/Button';
import { Typography } from "../../design-system/atoms/Typography";
import { SigningType, RequestSignPayloadInput, NetworkType, PermissionResponseOutput, ErrorResponse } from "@airgap/beacon-sdk";
import useAxios from 'axios-hooks';

interface SignInPageProps {
    theme?: Theme;
    beaconWallet?: BeaconWallet;
    embedKukai?: KukaiEmbed;
    setSignedPayload: Function;
}

const StyledStack = styled(Stack)`
    width: 100vw;
    max-width: 100rem;
`

const StyledExternalLink = styled.a`
    text-decoration: none;
`

const WrapperTitle = styled.div`
    width: 100%;

    @media (max-width: 1100px) {
        width: 100%;
    }
`

interface IUserParams {
    address: string | null;
    signedPayload: string | null;
}

const SignInPage: FC<SignInPageProps> = ({ beaconWallet, embedKukai, ...props }) => {

    const [socialLoading, setSocialLoading] = useState(false)
    const [beaconLoading, setBeaconLoading] = useState(false)
    const [signInParams, setSignInParams] = useState<IUserParams>({address: null, signedPayload: null})

    // const [signUser, signUserResponse] = useLazyQuery(SIGN_USER)
    const [signUserResponse, signUser] = useAxios({url: 'http://localhost:3000/auth/login', method: 'POST', headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }}, { manual: true})

    const [registerUserResponse, registerUser] = useAxios({url: 'http://localhost:3000/auth/register', method: 'POST', headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }}, { manual: true})

    const history = useHistory()

    // Sign expression function to sign user in
    const signExpression = async (userAddress: string, loginType: "embed" | "beacon") => {

        // The data to format
        const dappUrl = "d-art.io";
        const input = `Welcome to Kanvas ${userAddress}`;

        // The full string
        const formattedInput: string = [
            "Tezos Signed Message:",
            dappUrl,
            input
        ]
        .join(" ");

        const bytes = "05" + char2Bytes(formattedInput);

        const payload: RequestSignPayloadInput = {
            signingType: SigningType.MICHELINE,
            payload: bytes,
            sourceAddress: userAddress,
        }

        // Beacon signExpression
        if (beaconWallet && loginType === "beacon") {

            try {
                const signedPayload = await beaconWallet.client.requestSignPayload(payload)
                setSignInParams({ address: userAddress, signedPayload: signedPayload.signature })
                signUser({data: { name: userAddress, address: userAddress, signedPayload: signedPayload.signature }})
            } catch (error) {
                console.log(error)
                setBeaconLoading(false)
            }


        } else if (embedKukai && loginType === "embed") {
            try {
                const signedPayload = await embedKukai.signExpr('0501000000' + payload.payload.slice(2), 'Kanvas - sign in', 'Allow user to sign an expression with there wallet in order to sign them in.')
                setSignInParams({ address: userAddress, signedPayload: signedPayload })
                signUser({data: { address: userAddress, signedPayload: signedPayload }})
            } catch (error) {
                setSocialLoading(false)
                embedKukai.deinit()
            }
        }
    }

    const requestUserWalletPermission = async (loginType: 'embed' | 'beacon') => {
        if (beaconWallet && loginType === 'beacon') {
            setBeaconLoading(true)

            beaconWallet.client.requestPermissions({network: { type: NetworkType.FLORENCENET }})
                .then(async (response: PermissionResponseOutput) => {
                    signExpression(response.address, 'beacon')
                })
                .catch((permissionError: ErrorResponse) => {
                    console.log(permissionError)
                    setBeaconLoading(false)
                })

            setBeaconLoading(false)

        } else if (embedKukai && loginType === 'embed') {
            setSocialLoading(true)

            if (!embedKukai.initialized) {
                await embedKukai.init();
            }

            let userInfo : any = null;

            if (!embedKukai.user) {
                setSocialLoading(false)
                userInfo = await embedKukai.login();
            } else {
                userInfo = embedKukai.user;
            }

            if (userInfo) {
                signExpression(userInfo.pkh, 'embed')
            }
        }
    }

    useEffect (() => {
        if (beaconWallet) {
            setWalletProvider(beaconWallet);
        }
    }, [beaconWallet])

    const fade = cssTransition({
        enter: "animate__animated animate__fadeIn",
        exit: "animate__animated animate__fadeOut"
      });

    useEffect(() => {
        if (signUserResponse.data) {

            setSocialLoading(false)
            setBeaconLoading(false)

            localStorage.setItem('Kanvas - Bearer', signUserResponse.data.token)
            localStorage.setItem('Kanvas - address', signUserResponse.data.address)

            history.push(`/store`)
        }

    }, [signUserResponse.data])

    useEffect(() => {
        if (registerUserResponse.data) {

            setSocialLoading(false)
            setBeaconLoading(false)

            localStorage.setItem('Kanvas - Bearer', registerUserResponse.data.token)
            localStorage.setItem('Kanvas - address', registerUserResponse.data.address)

            history.push(`/store`)
        }

    }, [registerUserResponse.data])

    useEffect( () => {
        if (signUserResponse.error) {
            setSocialLoading(false)
            setBeaconLoading(false)

            if (signUserResponse.error?.response?.data.message === 'User not registered') {
                // Check if we have information from the user thanks to kukai
                registerUser({data: signInParams})

            } else {
                toast.error(signUserResponse.error.message, {position: toast.POSITION.TOP_RIGHT, transition: fade})
            }
        }
    }, [signUserResponse.error])

    return (
        <PageWrapper>
            <StyledStack direction="column" spacing={3}>

                <FlexSpacer minHeight={12} />

                <WrapperTitle>
                    <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                        <Typography size="h1" weight='SemiBold' sx={{justifyContent: 'center'}}> Sign in</Typography>
                    </Animated>
                    <FlexSpacer minHeight={1} />
                    <Typography size="h2" weight='Light' color={'#C4C4C4'} sx={{justifyContent: 'center'}}> Welcome to Kanvas ! Let’s begin by</Typography>
                    <Typography size="h2" weight='Light' color={'#C4C4C4'} sx={{justifyContent: 'center'}}> connecting your wallet. </Typography>

                </WrapperTitle>

                <FlexSpacer minHeight={4} />


                <Stack direction={{ xs: 'row', sm: 'row' }} spacing={3} sx={{ alignItems: "center", justifyContent: 'center' }}>
                    <CustomButton size="large" onClick={() => requestUserWalletPermission('beacon')} label="Connect wallet" loading={beaconLoading} />
                    <Typography size="h4" weight='Light'> Or </Typography>
                    <CustomButton size="large" onClick={() => requestUserWalletPermission('embed')} label="Social sign in" loading={socialLoading} />
                </Stack>


                <StyledExternalLink href="" target='_blank'>
                    <Typography size="h4" weight='Light' color={'#15a0e1'} sx={{justifyContent: 'center'}}> What's a wallet ? </Typography>
                </StyledExternalLink>
            </StyledStack>

        </PageWrapper>
    )
}

export default SignInPage