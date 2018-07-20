import React from 'react';
import {render} from 'react-dom';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';

import StreamPage from './app/streampage.jsx';

render(<StreamPage/>, document.getElementById('app'))
