import axios from 'axios';
import { Nft } from 'type';

export async function fetchMostViewed(
  notify: (value: string) => void,
): Promise<Nft[]> {
  try {
    const response = await axios.get(
      process.env.REACT_APP_STORE_BASE_URL +
        '/api/nfts?pageSize=8&orderBy=views&orderDirection=desc',
      {
        withCredentials: true,
      },
    );

    return response.data.nfts;
  } catch (e) {
    notify(`An error occurred while fetching most viewed`);
  }
  return [];
}
