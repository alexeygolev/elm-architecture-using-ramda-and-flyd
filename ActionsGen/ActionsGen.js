import R from 'ramda';

//----∆≣ withParamsA :: [String] -> (* -> Object)
function simpleA(x) {
  return function() {return {type: x[0]}}
}

//----∆≣ withParamsA :: [String] -> (* -> Object)
function withParamsA(x) {
  return function (...args) {
    return {
      type: x[0],
      ...R.zipObj(R.drop(1, x), args)
    }
  }
}

//-∆≣ createAction :: [String] -> (* -> Object)
const createAction = R.ifElse(R.compose(R.lt(1), R.length), withParamsA, simpleA);

//-∆≣ genActions :: [[String]] -> Object
const genActions = R.converge(R.zipObj, R.map(R.take(1)), R.map(createAction));

export {
  genActions
}
