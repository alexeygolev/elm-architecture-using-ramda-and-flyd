import superagent from 'superagent';
import {Future} from 'ramda-fantasy';

superagent.Request.prototype.createFuture = function() {
  return new Future((reject, resolve) => {
    this.end(function(e, res) {
      return (
        e !== null
          ? reject(e)
          : resolve(res)
      );
    });
  });
};

export default superagent;
