import { useNotify } from 'react-admin';
import React, { useEffect } from 'react';
import axios from 'axios';

interface Role {
  id: number;
  role_label: string;
}

interface GetRolesFromURL {
  notify: (value: string) => void;
  withId?: boolean;
}

const getCapitalizedRole = (role: Role) => {
  return role.role_label.charAt(0).toUpperCase() + role.role_label.slice(1);
};

const getRolesFromAPI = async ({
  notify,
  withId,
}: GetRolesFromURL): Promise<string[] | Record<string, unknown>[]> => {
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

    const fetchedRoles = withId
      ? roles.map((role: Role) => ({
          id: role.id,
          name: getCapitalizedRole(role),
        }))
      : roles.map((role: Role) => getCapitalizedRole(role));

    return fetchedRoles;
  } catch (e) {
    notify(`An error occurred while fetching the roles`);
  }

  return [];
};

const UseGetRolesFromAPI = ({ withId } = { withId: true }) => {
  const [roles, setRoles] = React.useState<
    string[] | Record<string, unknown>[]
  >([]);
  const notify = useNotify();

  useEffect(() => {
    getRolesFromAPI({ notify, withId }).then((fetchedRoles) => {
      setRoles(fetchedRoles);
    });
  }, []);

  return {
    roles,
  };
};

export default UseGetRolesFromAPI;
