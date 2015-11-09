var event = {};
var context = {
  invokeid: 'string',
  fail: function(err) {
    console.log('[FAIL]: ' + err);
    return 1;
  },
  succeed: function(data) {
    console.log('[SUCCESS]: ' + data);
    return 0;
  },
  done: function(data) {
    return;
  }
};

var lambdaFunction = require('./app')
lambdaFunction.handler(event, context)
