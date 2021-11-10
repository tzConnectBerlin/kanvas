import styled from "@emotion/styled";
import FlexSpacer from "../../atoms/FlexSpacer";
import { Box } from '@mui/system';
import { toast } from 'react-toastify';
import { Modal, Stack, Theme } from "@mui/material";
import { KukaiEmbed } from "kukai-embed";
import { SIGN_USER } from '../../../api/queries/user';
import { char2Bytes } from "@taquito/utils";
import { useHistory } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import { Animated } from "react-animated-css";
import { cssTransition } from 'react-toastify';
import { FC, useEffect, useState } from "react";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { setWalletProvider } from "../../../contracts/init";
import { CustomButton } from '../../atoms/Button';
import { Typography } from "../../atoms/Typography";
import { SigningType, RequestSignPayloadInput, NetworkType, PermissionResponseOutput, ErrorResponse } from "@airgap/beacon-sdk";
import useAxios from 'axios-hooks';
import { useTranslation } from 'react-i18next';

interface SignInModalProps {
    theme?: Theme;
    beaconWallet?: BeaconWallet;
    embedKukai?: KukaiEmbed;
    handleCloseModal: Function;
    open: boolean;
    setSignedPayload?: Function;
}

interface IUserParams {
    address: string | null;
    signedPayload: string | null;
}

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30rem',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};


const StyledStack = styled(Stack)`
    width: 100%;
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


export const SignInModal: FC<SignInModalProps> = ({ beaconWallet, embedKukai, ...props }) => {
    const [socialLoading, setSocialLoading] = useState(false)
    const [beaconLoading, setBeaconLoading] = useState(false)
    const [signInParams, setSignInParams] = useState<IUserParams>({ address: null, signedPayload: null })
    const { t } = useTranslation(['translation']);

    // const [signUser, signUserResponse] = useLazyQuery(SIGN_USER)
    const [signUserResponse, signUser] = useAxios({
        url: 'http://localhost:3000/auth/login', method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }, { manual: true })

    const [registerUserResponse, registerUser] = useAxios({
        url: 'http://localhost:3000/auth/register', method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }, { manual: true })

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
                signUser({ data: { name: userAddress, address: userAddress, signedPayload: signedPayload.signature } })
            } catch (error) {
                console.log(error)
                setBeaconLoading(false)
            }


        } else if (embedKukai && loginType === "embed") {
            try {
                const signedPayload = await embedKukai.signExpr('0501000000' + payload.payload.slice(2), 'Kanvas - sign in', 'Allow user to sign an expression with there wallet in order to sign them in.')
                setSignInParams({ address: userAddress, signedPayload: signedPayload })
                signUser({ data: { address: userAddress, signedPayload: signedPayload } })
            } catch (error) {
                setSocialLoading(false)
                embedKukai.deinit()
            }
        }
    }

    const requestUserWalletPermission = async (loginType: 'embed' | 'beacon') => {
        if (beaconWallet && loginType === 'beacon') {
            setBeaconLoading(true)

            beaconWallet.client.requestPermissions({ network: { type: NetworkType.FLORENCENET } })
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

            let userInfo: any = null;

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

    useEffect(() => {
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

    useEffect(() => {
        if (signUserResponse.error) {
            setSocialLoading(false)
            setBeaconLoading(false)

            if (signUserResponse.error?.response?.data.message === 'User not registered.') {
                // Check if we have information from the user thanks to kukai
                registerUser({ data: signInParams })

            } else {
                toast.error(signUserResponse.error.message, { position: toast.POSITION.TOP_RIGHT, transition: fade })
            }
        }
    }, [signUserResponse.error])


    return (
        <Modal
            keepMounted
            open={props.open}
            onClose={() => props.handleCloseModal(true)}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
        >
            <Box sx={style}>
                <StyledStack direction="column" spacing={3}>

                    <FlexSpacer minHeight={1} />

                    <WrapperTitle>
                        <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                            <Typography size="h1" weight='SemiBold' sx={{ justifyContent: 'center' }}>{t('modal.signIn.headline')} </Typography>
                        </Animated>
                        <FlexSpacer minHeight={1} />
                        <Typography size="h2" weight='Light' color={'#C4C4C4'} sx={{ textAlign: 'center', justifyContent: 'center' }}> </Typography>
                        <Typography size="h2" weight='Light' color={'#C4C4C4'} sx={{ textAlign: 'center', justifyContent: 'center' }}> {t('modal.signIn.text_2')}</Typography>

                    </WrapperTitle>

                    <FlexSpacer minHeight={1} />


                    <Stack direction={{ xs: 'row', sm: 'row' }} spacing={3} sx={{ alignItems: "center", justifyContent: 'center' }}>
                        <CustomButton size="large" onClick={() => requestUserWalletPermission('beacon')} label={t('modal.signIn.button_1')} loading={beaconLoading} />
                        <Typography size="h4" weight='Light'> {t('modal.signIn.text_3')} </Typography>
                        <CustomButton size="large" onClick={() => requestUserWalletPermission('embed')} label={t('modal.signIn.button_2')} loading={socialLoading} />
                    </Stack>


                    <StyledExternalLink href="" target='_blank'>
                        <Typography size="h4" weight='Light' color={'#15a0e1'} sx={{ justifyContent: 'center' }}>{t('modal.signIn.text_4')} </Typography>
                    </StyledExternalLink>
                    <FlexSpacer minHeight={2} />

                </StyledStack>
            </Box>
        </Modal>
    )
}