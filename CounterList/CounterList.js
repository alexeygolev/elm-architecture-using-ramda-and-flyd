import React from 'react';
import R from 'ramda';
import flyd from 'flyd';
import forwardTo from 'flyd-forwardto';

import * as Counter from './Counter.js';
//Model
/*
 data Model = {
 counters : [[ID, Counter.Model]],
 nextID: ID
 }
 type ID = Integer
 */

const modelLens = {
  counters: R.lensProp('counters'),
  nextID: R.lensProp('nextID'),
  counter: {
    ID: R.lensIndex(0),
    CounterModel: R.lensIndex(1)
  }
};
let counterID = R.view(modelLens.counter.ID);
let counterModel = R.view(modelLens.counter.CounterModel);

const Action = {
  insert() {
    return {
      type: 'Insert'
    }
  },
  remove(id) {
    return {
      type: 'Remove',
      id
    }
  },
  modify(id, action) {
    return {
      type: 'Modify',
      id,
      action
    }
  }
};

//-∆≣ init :: * -> Model
function init() {
  return {
    counters:[],
    nextID: 0
  };
}

//-∆≣ update :: Model -> Action -> Model
function update(model, action) {
  switch (action.type) {
    case 'Insert':
      let newCounter = [model.nextID, Counter.init(0)];
      let newCounters = R.append(newCounter, model.counters);
      return R.pipe(
        R.set(modelLens.counters, newCounters),
        R.set(modelLens.nextID, model.nextID + 1)
      )(model);
    case 'Remove':
      return R.over(modelLens.counters, R.filter(counter => counterID(counter) !== action.id), model);
    case 'Modify':
      let updateCounter = R.ifElse(
        R.compose(R.equals(action.id), counterID),
        (counter) => [counterID(counter), Counter.update(counterModel(counter), action.action)],
        R.identity
      );
      return R.over(modelLens.counters, R.map(updateCounter), model);
    default:
      return model;
  }
}

//-∆≣ actions :: FlydStream Action
const actions = flyd.stream();

//-∆≣ model :: FlydStream Model
const model = flyd.scan(update, init(), actions);

//-∆≣ view :: Model -> React.Component
class CounterView extends React.Component {
  render() {
    let {model} = this.props;
    return (
      <div>
        <button onClick={actions.bind(null, Action.insert())}>Add counter</button>
        {model.counters.map(counter => {
          return <Counter.CounterViewWithRemoveButton
            key={counterID(counter)}
            model={counterModel(counter)}
            context={{actions: forwardTo(actions, a => Action.modify(counterID(counter), a)),
            remove: forwardTo(actions, a => Action.remove(counterID(counter)))}}/>
        })}
      </div>
    )
  }
}


flyd.on(m => React.render(<CounterView model={m} />, document.getElementById('react-root')), model);

//flyd.on(a => console.log('action', a), actions);
//flyd.on(m => console.log('model', m), model);
