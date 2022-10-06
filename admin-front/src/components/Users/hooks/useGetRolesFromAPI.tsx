import { useNotify } from 'react-admin';
import React, { useEffect } from 'react';
import axios from 'axios';

interface Role {
  id: number;
  role_label: string;
}

interface GetRolesFromURL {
  notify: (value: string) => void;
}

const getRolesFromAPI = async ({
  notify,
}: GetRolesFromURL): Promise<string[]> => {
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

    const { data: roles } = response.data;

    const fetchedRoles = roles.map(
      (role: Role) =>
        role.role_label.charAt(0).toUpperCase() + role.role_label.slice(1),
    );
    return fetchedRoles;
  } catch (e) {
    notify(`An error occurred while fetching the roles`);
  }

  return [];
};

const UseGetRolesFromAPI = () => {
  const [roles, setRoles] = React.useState<string[]>([]);
  const notify = useNotify();

  useEffect(() => {
    getRolesFromAPI({ notify }).then((fetchedRoles) => {
      setRoles(fetchedRoles);
    });
  }, []);

  return {
    roles,
  };
};

export default UseGetRolesFromAPI;
