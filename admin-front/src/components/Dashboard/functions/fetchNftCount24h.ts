import axios from 'axios';

export async function fetchNftCount24h(
  notify: (value: string) => void,
): Promise<number> {
  const url =
    process.env.REACT_APP_API_SERVER_BASE_URL +
    '/analytics/sales/nftCount/snapshot?resolution=day';

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`,
      },
    });

    const count = response.data ? response.data.value : undefined;
    return count ?? 0;
  } catch (error) {
    notify(`An error happened while fetching nft count: ${error}`);
  }
  return 0;
}
