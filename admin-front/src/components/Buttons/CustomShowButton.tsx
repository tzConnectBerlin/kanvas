import { ShowButton } from 'react-admin';

export const CustomShowButton = (basePath: any) => (
  <ShowButton variant="contained" basePath={basePath} label="Show" />
);