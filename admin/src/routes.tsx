import * as React from "react";
import { Route } from 'react-router-dom';
import {PreviewPage} from './Pages/PreviewPage/index';

export default [
    <Route exact path="/preview/" component={PreviewPage} />
];