import axios from 'axios';

export interface TopBuyer {
  totalPaid: string;
  userAddress: string;
  userId: number;
  userPicture: string;
}

export async function fetchTopBuyers(
  notify: (value: string) => void,
): Promise<TopBuyer[]> {
  try {
    const response = await axios.get(
      (process.env.REACT_APP_STORE_API_URL ??
        process.env.REACT_APP_STORE_BASE_URL + '/api' ) +
        '/users/topBuyers',
      {
        withCredentials: true,
      },
    );
    return response.data.topBuyers as TopBuyer[];
  } catch (e) {
    notify(`An Error occurred while fetching top buyers`);
  }

  return [];
}
