var AWS = require('aws-sdk');
var Promise = require('bluebird');

function asyncDescribeInstances(ec2, params) {
  return new Promise(function(resolve, reject) {
    return ec2.describeInstances(params, function(err, data) {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
}

exports.handler = function(event, context) {
  var ec2 = new AWS.EC2();

  asyncDescribeInstances(ec2, {})
    .then(function(data) {
      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          console.log(instance.InstanceId);
        });
      });

      context.succeed('[SUCCESS]');
    })
    .catch(function(err) {
      console.log(err, err.trace);
      context.fail('[FAIL]');
    });
}
