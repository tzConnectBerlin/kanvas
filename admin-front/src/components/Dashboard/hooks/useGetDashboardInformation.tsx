import { useNotify } from 'react-admin';
import { useEffect, useState } from 'react';
import authProvider from 'auth/authProvider';
import {
  fetchTopBuyers,
  TopBuyer,
  fetchMostViewed,
  fetchTotalRevenue,
  fetchNftCount24h,
  fetchRoles,
} from '../functions/';
import { Nft } from 'type';

export const UseGetDashboardInformation = () => {
  const notify = useNotify();
  const [permissions, setPermissions] = useState<number[]>([]);
  const [totalNFTPriceRevenue, setTotalNFTPriceRevenue] = useState<number>(0);
  const [totalNFTCount24h, setTotalNFTCount24h] = useState<number>(0);
  //TODO: figure out why this type: { [i: string]: number } is used when "fetchRoles" returns: number[]
  const [roles, setRoles] = useState<{ [i: string]: number }>();

  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [mostViewed, setMostViewed] = useState<Nft[]>([]);

  useEffect(() => {
    const perm = async () => {
      setPermissions(await authProvider.getPermissions());
    };
    perm();
  }, []);

  useEffect(() => {
    fetchTopBuyers(notify).then((tBuyers) => setTopBuyers(tBuyers));
    fetchMostViewed(notify).then((mViewed) => setMostViewed(mViewed));
    fetchTotalRevenue(notify).then((totalRevenue) =>
      setTotalNFTPriceRevenue(totalRevenue),
    );
    fetchNftCount24h(notify).then((nftCount24h) =>
      setTotalNFTCount24h(nftCount24h),
    );
    // @ts-ignore TODO: setRoles should accept type number[] (fetchRoles returns it)
    fetchRoles(notify).then((fetchedRoles) => setRoles(fetchedRoles));
  }, [notify]);

  return {
    permissions,
    totalNFTPriceRevenue,
    totalNFTCount24h,
    roles,
    topBuyers,
    mostViewed,
  };
};

export default UseGetDashboardInformation;
