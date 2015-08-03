require('../node_modules/todomvc-app-css/index.css');
require ('../node_modules/todomvc-common/base.css');
import React from 'react';
import R from 'ramda';
import {createHistory} from 'history';
import classNames from 'classnames';
import {Either, IO, Maybe} from 'ramda-fantasy';
import flyd from 'flyd';
import {genActions} from '../ActionsGen/ActionsGen';
import * as TodoItem from './TodoItem';
import {onEnter, targetValue} from './Utils';
import forwardTo from 'flyd-forwardto';

const history = createHistory();
/*
 data Model = Model {
 tasks :: [Task],
 field :: String,
 uid :: Int,
 visibility :: String
 }
 */

/*
 data Task = Task {
 description :: String,
 completed :: Bool,
 editing :: Bool,
 id :: Int
 }
 */

//----∆≣ newTask :: String -> Int -> Task
function newTask(description, id) {
  return {
    description,
    completed: false,
    editing: false,
    id
  }
}
//-∆≣ emptyModel :: Model
const emptyModel = {
  tasks: [],
  visibility: 'All',
  field: '',
  uid: 0
};

let Action = genActions([
  ['NoOp'],
  ['UpdateField', 'str'],
  ['Add'],
  ['Modify', 'id', 'action'],
  ['Delete', 'id'],
  ['DeleteComplete'],
  ['CheckAll', 'isCompleted'],
  ['ChangeVisibility', 'visibility']
]);



//----∆≣ update :: Model -> Action -> Model
function update(action, model) {
  function updateTaskWithId(key, value){
    return R.ifElse(R.propEq('id', action.id), R.assoc(key, value), R.identity);
  }
  switch (action.type) {
    case 'NoOp':
      return model;
    case 'UpdateField':
      return R.assoc('field', action.str, model);
    case 'Add':
      return R.evolve({
        uid: R.inc,
        field: R.empty,
        tasks: R.isEmpty(model.field)
          ? R.identity
          : R.append(newTask(model.field, model.uid))
      }, model);
    case 'Modify':
      let idx = R.findIndex(R.propEq('id', action.id), model.tasks);
      return R.evolve({tasks: R.adjust(TodoItem.update(action.action), idx)}, model);
    case 'Delete':
      console.log('delete');
      return R.converge(R.assoc('tasks'), R.compose(R.reject(R.propEq('id', action.id)), R.prop('tasks')), R.identity)(model);
    case 'DeleteComplete':
      return R.converge(R.assoc('tasks'), R.compose(R.reject(R.prop('completed')), R.prop('tasks')), R.identity)(model);
    case 'CheckAll':
      let updateTask = R.assoc('completed', action.isCompleted);
      return R.converge(R.assoc('tasks'), R.compose(R.map(updateTask), R.prop('tasks')), R.identity)(model);
    case 'ChangeVisibility':
      return R.assoc('visibility', action.visibility)(model);
    default:
      return model;
  }
}


//----∆≣ taskList :: Address Action -> String -> [Task] -> React.Component
function taskList(address, visibility, tasks){
  function isVisible(todo){
    switch (visibility) {
      case 'Completed':
        return todo.completed;
      case 'Active':
        return !todo.completed;
      case 'All':
        return true;
      default:
        return false;
    }
  }
  let allCompleted = R.all(R.prop('completed'), tasks);
  let cssVisibility = R.isEmpty(tasks) ? 'hidden' : 'visible';
  return (
    <section
      className="main"
      style={{visibility: cssVisibility}}>
      <input
        className="toggle-all"
        type="checkbox"
        name="toggle"
        checked={allCompleted}
        onChange={address.bind(null, Action.CheckAll(!allCompleted))}/>
      <ul className="todo-list">
        {R.map(todo => <TodoItem.TodoItem key={todo.id} todo={todo} context={{
          actions$: forwardTo(actions$, a => Action.Modify(todo.id, a)),
          remove$: forwardTo(actions$, R.always(Action.Delete(todo.id)))
        }}/>, R.filter(isVisible, tasks))}
      </ul>
    </section>
  )
}

//----∆≣ taskEntry :: Address Action -> String -> React.Component
function taskEntry(address, task) {
  return(
    <header className="header">
      <h1>Todos</h1>
      <input
        className="new-todo"
        type="text"
        placeholder="What needs to be done?"
        autoFocus={true}
        value={task}
        name="newTodo"
        onChange={R.compose(address, Action.UpdateField, targetValue)}
        {...onEnter(address, Action.Add())}/>
    </header>
  )
}

class Link extends React.Component {
  catchClick(e){
    e.preventDefault();
    history.pushState({}, this.props.href)
  }
  render(){
    let {href, className} = this.props;
    return (
      <a href={href} className={className} onClick={this.catchClick.bind(this)}>{this.props.children}</a>
    )
  }
}


//-∆≣ visibilitySwap :: Address Action -> String -> String -> String -> React.Component
function visibilitySwap(address, uri, visibility, actualVisibility) {
  return (
    <li onClick={address.bind(null, Action.ChangeVisibility(visibility))}>
      <Link href={uri} className={classNames({selected: visibility === actualVisibility})}>{visibility}</Link>
    </li>
  )
}
//-∆≣ infoFooter ::  React.Component
const infoFooter = (
  <footer className="info">
    <p>Double-click to edit a todo</p>
    <p>Created by <a href="http://github.com/petehunt/">petehunt</a></p>
    <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
  </footer>
);
//----∆≣ controls :: Address Action -> String -> [Task] -> React.Component
function controls(address, visibility, tasks) {
  let tasksCompleted = R.length(R.filter(R.prop('completed'), tasks));
  let tasksLeft = R.length(tasks) - tasksCompleted;
  let item_ = tasksLeft === 1 ? ' item' : ' items';
  return (
    <footer className="footer">
      <span className="todo-count"><strong>{tasksLeft} </strong>{item_} left</span>
      <ul className="filters">
        {visibilitySwap(address, '/', 'All', visibility)}
        {visibilitySwap(address, '/active', 'Active', visibility)}
        {visibilitySwap(address, '/completed', 'Completed', visibility)}
      </ul>
      <button className="clear-completed" onClick={address.bind(null, Action.DeleteComplete())}>Clear completed ({tasksCompleted})</button>
    </footer>

  )
}

//-∆≣ view :: Address Action -> Model -> React.Component
class TodoMVC extends React.Component {
  shouldComponentUpdate(props){
    return this.props.model !== props.model;
  }
  render() {
    return (
      <div>
        <section
          className="todoapp">
          {taskEntry(this.props.address, this.props.model.field)}
          {taskList(this.props.address, this.props.model.visibility, this.props.model.tasks)}
          {controls(this.props.address, this.props.model.visibility, this.props.model.tasks)}
        </section>
        {infoFooter}
      </div>
    )
  }
}

//-∆≣ setLocal :: String -> Maybe String -> IO ()
let setLocal = R.curry((key, mState) => IO.of(R.map(state => localStorage.setItem(key, state), mState)));

//-∆≣ getLocal :: String -> IO String
let getLocal = key => IO.of(localStorage.getItem(key));

//-∆≣ stringify :: Object -> Maybe String
let stringify = model => {
  var _str;
  try{
    _str = Maybe.Just(JSON.stringify(model));
  } catch(e) {
    _str = Maybe.Nothing();
  }
  return _str;
};

//-∆≣ parse :: Object -> Maybe String
let parse = state => {
  var _str;
  try{
    _str = Maybe.Just(JSON.parse(state));
  } catch(e) {
    _str = Maybe.Nothing();
  }
  return _str;
};

//-∆≣ savedModel :: String -> IO Maybe Object
const getSavedModel = R.compose(R.map(parse), getLocal);

//-∆≣ saveModel :: String -> Object -> IO ()
const saveModel = R.uncurryN(2, (key) => R.compose(setLocal(key), stringify));

const initialModel = getSavedModel('state').runIO().getOrElse(emptyModel);



//-∆≣ actions :: FlydStream Action
const actions$ = flyd.stream();

//-∆≣ model :: FlydStream Model
const model$ = flyd.scan(R.flip(update), initialModel, actions$);

flyd.map(model => saveModel('state', model), model$);

flyd.on(m => React.render(<TodoMVC model={m} address={actions$}/>, document.getElementById('react-root')), model$);



//flyd.on(a => console.log('action', a), actions$);
//flyd.on(m => console.log('model', m), model$);
