var AWS = require('aws-sdk')

exports.handler = function(event, context) {
  var ec2 = new AWS.EC2();

  ec2.describeInstances({}, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail('[FAIL]');
    } else {
      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          console.log(instance.InstanceId);
        });
      });
      context.succeed('[SUCCESS]')
    }
  })
}
