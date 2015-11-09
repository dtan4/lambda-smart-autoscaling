var event = {};
var context = {
  invokeid: 'string',
  fail: function(err, data) {
    return 1;
  },
  succeed: function(err, data) {
    return 0;
  },
  done: function(err, data) {
    return;
  }
};

var lambdaFunction = require('./app')
lambdaFunction.handler(event, context)
