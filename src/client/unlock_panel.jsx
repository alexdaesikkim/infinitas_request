import React from 'react';
import {render} from 'react-dom';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';

import UnlockPanel from './app/unlockpanel.jsx';

render(<UnlockPanel/>, document.getElementById('app'))
