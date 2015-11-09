var AWS = require('aws-sdk');
var Promise = require('bluebird');
var ec2 = Promise.promisifyAll(new AWS.EC2());

exports.handler = function(event, context) {
  ec2.describeInstancesAsync({})
    .then(function(data) {
      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          console.log(instance.InstanceId);
        });
      });
    })
    .then(function() {
      context.succeed('[SUCCESS]');
    })
    .catch(function(err) {
      console.log(err, err.trace);
      context.fail('[FAIL]');
    });
}
