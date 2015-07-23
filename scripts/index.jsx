import React from 'react';
import R from 'ramda';
import flyd from 'flyd';
import forwardTo from 'flyd-forwardto';

import * as Counter from './Counter.jsx';
//Model
const initialModel = 0;

const topLens = R.lensProp('topCounter');
const bottomLens = R.lensProp('bottomCounter');

//-∆≣ type Action = Increment | Decrement
const action = {
  increment() {
    return {
      type: 'Increment'
    }
  },
  decrement() {
    return {
      type: 'Decrement'
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
        <Counter.CounterView model={model.topCounter} stream={forwardTo(actions, action => {return {type: 'Top', value: action}})}/>
        <Counter.CounterView model={model.bottomCounter} stream={forwardTo(actions, action => {return {type: 'Bottom', value: action}})}/>
        <button onClick={actions.bind(null, {type: 'Reset'})}>Reset</button>
      </div>
    )
  }
}
//}


flyd.on(m => React.render(<CounterView model={m} />, document.getElementById('react-root')), model);
