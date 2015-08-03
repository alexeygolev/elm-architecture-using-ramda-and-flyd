import React from 'react';
import R from 'ramda'
import classNames from 'classnames';
import {IO} from 'ramda-fantasy';
import Type from 'union-type';
import {genActions} from '../ActionsGen/ActionsGen';
import {
  onEnter,
  findDOMNode,
  targetValue
} from './Utils';

const Action = genActions([
  ['Check', 'id', 'isCompleted'],
  ['EditingTask', 'id', 'isEditing'],
  ['UpdateTask', 'id', 'task']
]);

//----∆≣ update :: Model -> Action -> Model
const update = R.curry(function update(action, model) {
  switch (action.type) {
    case 'NoOp':
      return model;
    case 'EditingTask':
      return R.assoc('editing', action.isEditing, model);
    case 'UpdateTask':
      return R.assoc('description', action.task, model);
    case 'Check':
      return R.assoc('completed', action.isCompleted, model);
    default:
      return model;
  }
});

//----∆≣ todoItem :: Address Action -> Task -> React.Component
class TodoItem extends React.Component {
  shouldComponentUpdate(props){
    return this.props.todo !== props.todo;
  }
  componentDidUpdate(oldProps){
    if(oldProps.todo.editing === false && this.props.todo.editing) {
      findDOMNode(this.refs.update)
        .map(R.tap(R.invoker(0, 'focus')))
        .map(R.tap(node => node.setSelectionRange(node.value.length, node.value.length)))
        .runIO();
    }
  }
  render(){
    let {context, todo} = this.props;
    return (
      <li key={todo.id} className={classNames({completed: todo.completed},{editing: todo.editing})}>
        <div className="view">
          <input
            type="checkbox"
            className="toggle"
            checked={todo.completed}
            onChange={context.actions$.bind(null, Action.Check(todo.id, !todo.completed))}
          />
          <label
            onDoubleClick={context.actions$.bind(null, Action.EditingTask(todo.id, true))}
          >{todo.description}
          </label>
          <button className="destroy"
                  onClick={context.remove$.bind(null)}>
          </button>
        </div>
        <input
          ref="update"
          className="edit"
          value={todo.description}
          name="title"
          id={'todo-' + todo.id}
          onBlur={context.actions$.bind(null, Action.EditingTask(todo.id, false))}
          onChange={R.compose(context.actions$, Action.UpdateTask(todo.id), targetValue)}
          {...onEnter(context.actions$, Action.EditingTask(todo.id, false))}/>
      </li>
    )
  }
}

export {
  TodoItem,
  update
}
