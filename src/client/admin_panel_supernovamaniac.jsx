import React from 'react';
import {render} from 'react-dom';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';

import AdminPanel from './app/adminpanel.jsx';

render(<AdminPanel/>, document.getElementById('app'))
