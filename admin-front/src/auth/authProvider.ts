import axios from 'axios';
import {
  login,
  logout,
  isLoggedIn,
  getToken,
  getDecodedToken,
} from './authUtils';

const authProvider = {
  login: async ({ username, password }: any) => {
    return await login({ username, password });
  },
  logout: () => {
    logout();
    return Promise.resolve();
  },
  checkError: ({ status }: { status: number }) => {
    if (status === 401) {
      logout();
      return Promise.reject();
    }
    return Promise.resolve();
  },

  checkAuth: async () =>
    (await getToken()) ? Promise.resolve() : Promise.reject(),

  getPermissions: async () => {
    const user = await getDecodedToken();

    return user ? Promise.resolve(user.scope) : Promise.reject();
  },
};

export default authProvider;
