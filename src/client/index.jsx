import React from 'react';
import {render} from 'react-dom';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';

import UserPage from './app/userpage.jsx';

render(<UserPage/>, document.getElementById('app'))
