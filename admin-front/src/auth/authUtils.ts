import axios from 'axios';
import { UserType } from '../types/basicTypes';
import jwt_decode from 'jwt-decode';

interface LoginParams {
  username?: string;
  password?: string;
}

interface Decoded {
  email: string;
  iat: number;
  userName: string;
  sub: number;
  scope: number[];
}

export async function login({ username, password }: LoginParams) {
  logout();

  try {
    const loggedIn = await axios({
      url: process.env.REACT_APP_API_SERVER_BASE_URL + '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { username, password },
    });
    return setToken(loggedIn.data.accessToken);
  } catch (e) {
    throw new Error('Login Failed!');
  }
}
export function logout() {
  localStorage.removeItem('KanvasAdmin - Bearer');
}

export async function isLoggedIn(): Promise<UserType | boolean> {
  const user = localStorage.getItem('KanvasAdmin - Bearer');
  const loggedUser = await axios({
    url: process.env.REACT_APP_API_SERVER_BASE_URL + `user/${user?.sub}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`,
    },
  });

  return loggedUser.data ?? false;
}

export function getDecodedToken() {
  const token = localStorage.getItem('KanvasAdmin - Bearer');
  const decoded: Decoded = jwt_decode(token ?? '');
  return decoded;
}

export function getToken() {
  return localStorage.getItem('KanvasAdmin - Bearer');
}
export function setToken(token: string) {
  localStorage.setItem('KanvasAdmin - Bearer', token);
}