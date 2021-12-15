import * as React from 'react';
import { KukaiEmbed, Networks } from 'kukai-embed';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { initTezos, initWallet } from '../contracts/init';
import { RPC_URL } from '../global';

interface WalletProps {
  embedKukai?: KukaiEmbed;
  beaconWallet?: BeaconWallet;
}

const WalletContext = React.createContext<WalletProps>({
  embedKukai: undefined,
  beaconWallet: undefined,
});

const useWallets = () => {
  const { embedKukai, beaconWallet } = React.useContext(WalletContext);

  return { kukai: embedKukai, beacon: beaconWallet };
};

interface ContextProviderProps {
  children: React.ReactElement;
}
/**
 * If wallet/ blockchain access is still required in the admin system (for the final step)
 * it will likely be required to wrap the app in this context provider as react-admin may complain about expected props.
 */
const ContextProvider = ({ children }: ContextProviderProps) => {
  const [embedKukai, setEmbedKukai] = React.useState<KukaiEmbed>();
  const [beaconWallet, setBeaconWallet] = React.useState<BeaconWallet>();
  const value = React.useMemo(
    () => ({ embedKukai, beaconWallet }),
    [beaconWallet, embedKukai],
  );

  React.useEffect(() => {
    if (!embedKukai) {
      setEmbedKukai(
        new KukaiEmbed({
          net: Networks.granadanet,
          icon: false,
        }),
      );
    }
  }, [embedKukai]);

  React.useEffect(() => {
    initTezos(RPC_URL);
    setBeaconWallet(initWallet());
  }, []);

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export { ContextProvider, useWallets };
