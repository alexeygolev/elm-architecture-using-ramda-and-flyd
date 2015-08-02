require('../node_modules/todomvc-app-css/index.css');
require ('../node_modules/todomvc-common/base.css');
import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import {Either, IO, Maybe} from 'ramda-fantasy';
import flyd from 'flyd';
import {genActions} from '../ActionsGen/ActionsGen';


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

function targetValue(e){
  return e.target.value
}

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
  ['EditingTask', 'id', 'isEditing'],
  ['UpdateTask', 'id', 'task'],
  ['Add'],
  ['Delete', 'id'],
  ['DeleteComplete'],
  ['Check', 'id', 'isCompleted'],
  ['CheckAll', 'isCompleted'],
  ['ChangeVisibility', 'visibility']
]);



//----∆≣ update :: Model -> Action -> Model
function update(model, action) {
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
    case 'EditingTask':
      return R.converge(
        R.assoc('tasks'),
        R.compose(R.map(updateTaskWithId('editing', action.isEditing)), R.prop('tasks')),
        R.identity
      )(model);
    case 'UpdateTask':
      return R.converge(
        R.assoc('tasks'),
        R.compose(R.map(updateTaskWithId('description', action.task)), R.prop('tasks')),
        R.identity
      )(model);
    case 'Delete':
      return R.converge(R.assoc('tasks'), R.compose(R.reject(R.propEq('id', action.id)), R.prop('tasks')), R.identity)(model);
    case 'DeleteComplete':
      return R.converge(R.assoc('tasks'), R.compose(R.reject(R.prop('completed')), R.prop('tasks')), R.identity)(model);
    case 'Check':
      return R.converge(
        R.assoc('tasks'),
        R.compose(R.map(updateTaskWithId('completed', action.isCompleted)), R.prop('tasks')),
        R.identity
      )(model);
    case 'CheckAll':
      let updateTask = R.assoc('completed', action.isCompleted);
      return R.converge(R.assoc('tasks'), R.compose(R.map(updateTask), R.prop('tasks')), R.identity)(model);
    case 'ChangeVisibility':
      return R.assoc('visibility', action.visibility)(model);
    default:
      return model;
  }
}

//----∆≣ is13 :: Int -> Either String ()
function is13(code) {
  return code === 13
    ? Either.Right()
    : Either.Left('Not the right key code')
}

//----∆≣ onEnter :: Address a -> a -> Prop
function onEnter(address, value){
  return {
    onKeyDown(e){
      R.map(() => address(value), is13(e.keyCode))
    }
  }
}

//----∆≣ findDOMNode :: Ref -> IO DOMNode
function findDOMNode(ref) {
  return IO.of(React.findDOMNode(ref))
}

//----∆≣ todoItem :: Address Action -> Task -> React.Component
class TodoItem extends React.Component {
  componentDidUpdate(oldProps){
    if(oldProps.todo.editing === false && this.props.todo.editing) {
      findDOMNode(this.refs.update)
        .map(R.tap(R.invoker(0, 'focus')))
        .map(R.tap(node => node.setSelectionRange(node.value.length, node.value.length)))
        .runIO();
    }
  }
  render(){
    let {address, todo} = this.props;
    return (
      <li key={todo.id} className={classNames({completed: todo.completed},{editing: todo.editing})}>
        <div className="view">
          <input
            type="checkbox"
            className="toggle"
            checked={todo.completed}
            onChange={address.bind(null, Action.Check(todo.id, !todo.completed))}
          />
          <label
            onDoubleClick={address.bind(null, Action.EditingTask(todo.id, true))}
          >{todo.description}
          </label>
          <button className="destroy"
                  onClick={address.bind(null, Action.Delete(todo.id))}>
          </button>
        </div>
        <input
          ref="update"
          className="edit"
          value={todo.description}
          name="title"
          id={'todo-' + todo.id}
          onBlur={address.bind(null, Action.EditingTask(todo.id, false))}
          onChange={R.compose(address, Action.UpdateTask(todo.id), targetValue)}
          {...onEnter(address, Action.EditingTask(todo.id, false))}/>
      </li>
    )
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
        {R.map(todo => <TodoItem key={todo.id} address={address} todo={todo}/>, R.filter(isVisible, tasks))}
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

//-∆≣ visibilitySwap :: Address Action -> String -> String -> String -> React.Component
function visibilitySwap(address, uri, visibility, actualVisibility) {
  return (
    <li onClick={address.bind(null, Action.ChangeVisibility(visibility))}>
      <a href={uri} className={classNames({selected: visibility === actualVisibility})}>{visibility}</a>
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
          {visibilitySwap(address, '#/', 'All', visibility)}
          {visibilitySwap(address, '#/active', 'Active', visibility)}
          {visibilitySwap(address, '#/completed', 'Completed', visibility)}
        </ul>
        <button className="clear-completed" onClick={address.bind(null, Action.DeleteComplete())}>Clear completed ({tasksCompleted})</button>
    </footer>

  )
}

//-∆≣ view :: Address Action -> Model -> React.Component
class TodoMVC extends React.Component {
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

//-∆≣ actions :: FlydStream Action
const actions$ = flyd.stream();

//-∆≣ model :: FlydStream Model
const model$ = flyd.scan(update, emptyModel, actions$);


flyd.on(m => React.render(<TodoMVC model={m} address={actions$}/>, document.getElementById('react-root')), model$);


flyd.on(a => console.log('action', a), actions$);
flyd.on(m => console.log('model', m), model$);
