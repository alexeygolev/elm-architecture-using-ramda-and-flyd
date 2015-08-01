import React from 'react';
import R from 'ramda';
import flyd from 'flyd';
import {genActions} from '../ActionsGen/ActionsGen';

//Model
const initialModel = 0;


//-∆≣ type Action = Increment | Decrement
//const action = {
//  increment() {
//    return {
//      type: 'Increment'
//    }
//  },
//  decrement() {
//    return {
//      type: 'Decrement'
//    }
//  }
//};

//-∆≣ type Action = Increment | Decrement
const Action = genActions([['Increment'], ['Decrement']]);

//-∆≣ update :: Model -> Action -> Model
function update(model, action) {
  switch (action.type) {
    case 'Increment':
      return model + 1;
    case 'Decrement':
      return model - 1;
    default:
      return model;
  }
}


//-∆≣ init :: Integer -> Model
function init(v) {
  return v;
}

//-∆≣ actions :: FlydStream Action
const actions = flyd.stream();


const model = flyd.scan(update, initialModel, actions);

//view should be FlydStream Action -> Model -> ReactDOM

//-∆≣ view :: FlydStream Action -> Model -> React.Component
class CounterView extends React.Component {
  shouldComponentUpdate(props){
    return this.props.model !== props.model;
  }
  render() {
    let {stream, model} = this.props;
    return (
      <div>
        <p>{model}</p>
        <button onClick={stream.bind(null, {type: 'Increment'})}>+</button>
        <button onClick={stream.bind(null, {type: 'Decrement'})}>-</button>
      </div>
    )
  }
}

class CounterViewWithRemoveButton extends React.Component {
  shouldComponentUpdate(props){
    return this.props.model !== props.model;
  }
  render() {
    let {model, context} = this.props;
    return (
      <div>
        <CounterView stream={context.actions} model={model}/>
        <button onClick={context.remove}>Remove</button>
      </div>
    )
  }
}

export default {
  init,
  update,
  model,
  CounterView,
  CounterViewWithRemoveButton
}
