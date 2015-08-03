import {findDOMNode as findDOMNodeR} from 'react';
import R from 'ramda';
import {Either, IO} from 'ramda-fantasy';

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
  return IO.of(findDOMNodeR(ref))
}

function targetValue(e){
  return e.target.value
}

export {
  is13,
  onEnter,
  findDOMNode,
  targetValue
}
