import React from 'react';
import R from 'ramda';
import flyd from 'flyd';
import adt from 'adt';
//Model

const initialModel = 0;

let createTs = R.reduce((acc,cur) => {acc[cur] = cur; return acc},{});
let t = createTs(['Increment', 'Decrement']);

console.log('t', t);
//-∆≣ type Action = Increment | Decrement
const Action = {
  Increment() {
    return {
      type: t.Increment
    }
  },
  Decrement() {
    return {
      type: t.Decrement
    }
  }
};

//-∆≣ update :: Model -> Action -> Model
function update(model, action) {
  switch (action.type) {
    case t.Increment:
      return model + 1;
    case t.Decrement:
      return model - 1;
    default:
      return model;
  }
}

//-∆≣ init :: Integer -> Model
function init(v) {
  return v;
}

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
        <button onClick={actions.bind(null, Action.Increment())}>+</button>
        <button onClick={actions.bind(null, Action.Decrement())}>-</button>
      </div>
    )
  }
}

//-∆≣ actions :: FlydStream Action
const actions = flyd.stream();

//-∆≣ model :: FlydStream Model
const model = flyd.scan(update, init(0), actions);


flyd.on(m => React.render(<CounterView model={m} />, document.getElementById('react-root')), model);


