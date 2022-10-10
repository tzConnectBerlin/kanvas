import axios from 'axios';

export async function fetchTotalRevenue(
  notify: (value: string) => void,
): Promise<number> {
  const url =
    process.env.REACT_APP_API_SERVER_BASE_URL +
    '/analytics/sales/priceVolume/snapshot?resolution=infinite';

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`,
      },
    });
    const price = response.data ? response.data.value : undefined;
    return price ?? 0;
  } catch (e) {
    notify(`An error happened while fetching total revenue`);
  }
  return 0;
}
