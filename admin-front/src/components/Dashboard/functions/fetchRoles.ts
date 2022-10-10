import axios from 'axios';

//TODO: this is returning a number[] but for some reason the assumption in Dashboard.tsx UI logic is that it returns type { [i: string]: number }. Investigate why.
export async function fetchRoles(
  notify: (value: string) => void,
): Promise<number[]> {
  try {
    const response = await axios.get(
      process.env.REACT_APP_API_SERVER_BASE_URL + '/role',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            'KanvasAdmin - Bearer',
          )}`,
        },
      },
    );

    const newRoles: { [i: string]: number } = {};
    return response.data.data.map(
      (role: any) => (newRoles[role.role_label] = role.id),
    );
  } catch (error) {
    notify(`An error occurred while fetching the roles: ${error}`);
  }
  return [];
}
