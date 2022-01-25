import styled from '@emotion/styled';
import { Box } from '@mui/system';
import { Stack, Theme, Button, Typography } from '@mui/material';
import { char2Bytes } from '@taquito/utils';
import { FC, useEffect, useState } from 'react';
import {
  SigningType,
  RequestSignPayloadInput,
  NetworkType,
  PermissionResponseOutput,
  ErrorResponse,
} from '@airgap/beacon-sdk';
import authProvider from '../../auth/authProvider';
import { getToken } from '../../auth/authUtils';
import { useWallets } from '../../context/AuthContext';
import { TextField } from '@material-ui/core';
import { isValidEmail } from '../../utils/utils';

interface SignInModalProps {
  theme?: Theme;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '28rem',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const StyledStack = styled(Stack)`
  width: 100%;
  max-width: 100rem;
`;

const StyledExternalLink = styled.a`
  text-decoration: none;
`;

const WrapperTitle = styled.div`
  width: 100%;

  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const SignInModal: FC<SignInModalProps> = ({ ...props }) => {
  const { beacon, kukai } = useWallets();
  const [socialLoading, setSocialLoading] = useState(false);
  const [beaconLoading, setBeaconLoading] = useState(false);
  const [email, setEmail] = useState<string>('');

  // Sign expression function to sign user in
  const signExpression = async (
    userAddress: string,
    loginType: 'embed' | 'beacon',
  ) => {
    // The data to format
    const dappUrl = 'd-art.io';
    const input = `Welcome to KanvasAdmin ${userAddress}`;

    // The full string
    const formattedInput: string = [
      'Tezos Signed Message:',
      dappUrl,
      input,
    ].join(' ');

    const bytes = '05' + char2Bytes(formattedInput);

    const payload: RequestSignPayloadInput = {
      signingType: SigningType.MICHELINE,
      payload: bytes,
      sourceAddress: userAddress,
    };

    // Beacon signExpression
    if (beacon && loginType === 'beacon') {
      try {
        const signedPayload = await beacon.client.requestSignPayload(payload);
        authProvider
          .login({
            email,
            address: userAddress,
            signedPayload: signedPayload.signature,
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log(error);
        setBeaconLoading(false);
      }
    } else if (kukai && loginType === 'embed') {
      try {
        const signedPayload = await kukai.signExpr(
          '0501000000' + payload.payload.slice(2),
        );
        authProvider
          .login({
            email,
            address: userAddress,
            signedPayload: signedPayload,
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        setSocialLoading(false);
        kukai.deinit();
      }
    }
  };

  const requestUserWalletPermission = async (loginType: 'embed' | 'beacon') => {
    if (beacon && loginType === 'beacon') {
      setBeaconLoading(true);

      beacon.client
        .requestPermissions({
          network: { type: NetworkType.HANGZHOUNET },
        })
        .then(async (response: PermissionResponseOutput) => {
          signExpression(response.address, 'beacon');
        })
        .catch((permissionError: ErrorResponse) => {
          console.log(permissionError);
          setBeaconLoading(false);
        });

      setBeaconLoading(false);
    } else if (kukai && loginType === 'embed') {
      setSocialLoading(true);

      if (!kukai.initialized) {
        await kukai.init();
      }

      let userInfo: any = null;

      if (!kukai.user) {
        setSocialLoading(false);
        userInfo = await kukai.login().catch((e) => console.log(e));
      } else {
        userInfo = kukai.user;
      }

      if (userInfo) {
        signExpression(userInfo.pkh, 'embed');
      }
    }
  };


  useEffect(() => {
    if (getToken()) {
      setSocialLoading(false);
      setBeaconLoading(false);

      window.location.href = '/';
    }
  }, [props]);

  return (
    <Box sx={style}>
      <StyledStack direction="column" spacing={3}>
        <WrapperTitle>
          <Typography
            fontSize="20px"
            sx={{
              justifyContent: 'center',
              textAlign: 'center',
              paddingBottom: '1rem',
            }}
          >
            Sign in
          </Typography>

          <Typography
            color={'#787878'}
            sx={{
              textAlign: 'center',
              justifyContent: 'center',
            }}
          >
            Welcome to Kanvas-Admin. Connect your wallet and enter your email to
            sign in.
          </Typography>
        </WrapperTitle>

        <Stack
          direction={{ xs: 'row', sm: 'row' }}
          spacing={3}
          sx={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <Button
            variant="outlined"
            size="medium"
            onClick={() => requestUserWalletPermission('beacon')}
            disabled={!isValidEmail(email) || beaconLoading}
          >
            Connect wallet
          </Button>
          <Typography>or</Typography>
          <Button
            variant="outlined"
            size="medium"
            onClick={() => requestUserWalletPermission('embed')}
            disabled={!isValidEmail(email) || socialLoading}
          >
            Social sign in
          </Button>
        </Stack>
        <TextField
          id="email"
          type="email"
          placeholder="Enter Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <StyledExternalLink href="" target="_blank">
          <Typography color={'#15a0e1'} sx={{ justifyContent: 'center' }}>
            What's a wallet?
          </Typography>
        </StyledExternalLink>
      </StyledStack>
    </Box>
  );
};
