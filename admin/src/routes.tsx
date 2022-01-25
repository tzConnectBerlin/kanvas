import * as React from "react";
import { Route } from 'react-router-dom';
import {ProductPage} from './Pages/Product/index';

export default [
    <Route exact path="/preview/" component={ProductPage} />
];