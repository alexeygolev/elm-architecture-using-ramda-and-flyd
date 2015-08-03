import React from 'react';
import R from 'ramda';
import {Either, IO, Maybe, Future} from 'ramda-fantasy';
import flyd from 'flyd';
import {genActions} from '../ActionsGen/ActionsGen';
import forwardTo from 'flyd-forwardto';
import {targetValue} from '../Todo/Utils';
import request from './superagent-future/index';

let Result = genActions([
  ['Ok', 'data'],
  ['Err', 'error']
]);
let parse = R.compose(JSON.parse, R.prop('text'));

let cF = R.curry((r, url) => r(url).createFuture());

let bimap = R.invoker(2, 'bimap');

//-∆≣ view :: String -> Future String [String] -> React.Component
class ZipCodes extends React.Component {
  render() {
    let {query, result} = this.props;

    let messages = result.type === 'Ok'
      ? R.mapObjIndexed((val,key) => <div>{key}: {val.title}</div>, result.data.administrative)
      : <div><p>{result.error}</p></div>;
    return (
      <div>
        <input
          placeholder="Zip Code"
          value={query()}
          onChange={R.compose(query, targetValue)}
          type="text"/>
        {messages}
        <p>Hint: try SW17 0RS</p>
      </div>
    )
  }
}

const query$ = flyd.stream('');
const result$ = flyd.stream();
const merge$ = flyd.merge(query$, result$);

const request$ = flyd.map(
  task => task.fork(
    R.compose(result$, Result.Err),
    R.compose(result$, Result.Ok)
  ),
  flyd.map(lookupZipCode, query$)
);


flyd.on(() => React.render(<ZipCodes query={query$} result={result$()}/>, document.getElementById('react-root')), merge$);

function lookupZipCode(query) {
  let toUrl = new Future((reject, resolve) => {
    if(query.match(/[A-Za-z]{1,2}[0-9][A-Za-z0-9]?\s?[0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}/)){
      resolve(`http://uk-postcodes.com/postcode/${query}.json`);
    } else {
      reject('Give me a valid UK post code!');
    }
  });
    return toUrl.chain(R.compose(bimap(R.always('Not found:('), R.identity), R.map(parse), cF(request.get)));
}


//flyd.on(a => console.log('action', a), actions$);
//flyd.on(m => console.log('model', m), model$);
