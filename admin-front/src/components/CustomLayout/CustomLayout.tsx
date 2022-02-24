import * as React from 'react';
import CustomAppBar from '../CustomAppBar';

import { Layout } from 'react-admin';

export const CustomLayout = (props: any) => <Layout {...props} appBar={CustomAppBar} />;