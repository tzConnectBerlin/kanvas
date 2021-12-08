export interface IRole {
  Admin: number;
  [key: string]: number;
}

/**
 * Inject roles from config file here
 */
export const Role: IRole = {
  Admin: 1,
};
