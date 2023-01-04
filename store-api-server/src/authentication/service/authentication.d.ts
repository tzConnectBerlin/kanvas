export interface IAuthentication {
  id: number;
  userAddress: string;
  token: string;
  maxAge?: number;
}
