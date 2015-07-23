import React from 'react';
import R from 'ramda';
import flyd from 'flyd';
import forwardTo from 'flyd-forwardto';

import * as Counter from './Counter.jsx';
//Model
/*
data Model = {
 counters : [[ID, Counter.Model]],
 nextID: ID
 }
  type ID = Integer
 */

const topLens = R.lensProp('topCounter');
const bottomLens = R.lensProp('bottomCounter');

//-∆≣ type Action = Increment | Decrement
const action = {
  reset() {
    return {
      type: 'Reset'
    }
  },
  top(act) {
    return {
      type: 'Top',
      value: act
    }
  },
  bottom(act) {
    return {
      type: 'Bottom',
      value: act
    }
  }
};

//-∆≣ init :: Integer -> Integer -> Model
function init(vt, vb) {
  return {
    topCounter: Counter.init(vt),
    bottomCounter: Counter.init(vb)
  };
}

//-∆≣ update :: Model -> Action -> Model
function update(model, action) {
  switch (action.type) {
    case 'Reset':
      return init(0,0);
    case 'Top':
      return R.set(topLens, Counter.update(model.topCounter, action.value), model);
    case 'Bottom':
      return R.set(bottomLens, Counter.update(model.bottomCounter, action.value), model);
    default:
      return model;
  }
}

//-∆≣ actions :: FlydStream Action
const actions = flyd.stream();

//-∆≣ model :: FlydStream Model
const model = flyd.scan(update, init(0,0), actions);

//-∆≣ view :: Model -> React.Component
class CounterView extends React.Component {
  render() {
    let {model} = this.props;
    console.log('render main');
    return (
      <div>
        <Counter.CounterView model={model.topCounter} stream={forwardTo(actions, a => action.top(a))}/>
        <Counter.CounterView model={model.bottomCounter} stream={forwardTo(actions, a => action.bottom(a))}/>
        <button onClick={actions.bind(null, action.reset())}>Reset</button>
      </div>
    )
  }
}
//}


flyd.on(m => React.render(<CounterView model={m} />, document.getElementById('react-root')), model);
