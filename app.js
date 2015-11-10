const AMI_ID = 'ami-97f1abf9'; // CoreOS beta 835.2.0 ap-norteast-1 HVM
const INSTANCE_TYPE = 'c4.xlarge';
const KEY_NAME = 'key name';
const SECURITY_GROUPS = ['sg-1', 'sg-2'];
const SUBNET_ID = 'subnet-1';
const VOLUME_SIZE = 50;
const VOLUME_TYPE = 'gp2';

const DESIRED_COUNT = 2;
const ONDEMAND_COUNT = 0;

const LEAST_PRICE = 0;
const ONDEMAND_PRICE = 0.279; // c4.xlarge

const DRY_RUN = false;

const S3_BUCKET = '';
const USER_DATA = '';

var AWS = require('aws-sdk');
var Promise = require('bluebird');
var ec2 = Promise.promisifyAll(new AWS.EC2());
var s3 = Promise.promisifyAll(new AWS.S3());

function calculateBiddingPrice() {
  return ec2.describeSpotPriceHistoryAsync({
    AvailabilityZone: 'ap-northeast-1c',
    InstanceTypes: [INSTANCE_TYPE],
    MaxResults: 1
  }).then(function(data) {
    var recent_price = parseFloat(data.SpotPriceHistory[0].SpotPrice);

    if (recent_price * 1.2 < LEAST_PRICE) {
      return LEAST_PRICE;
    }

    if (recent_price * 1.2 < ONDEMAND_PRICE) {
      return recent_price * 1.2;
    }

    return -1;
  });
}

function calculateLaunchCounts(slaves) {
  return slaves.length != DESIRED_COUNT ? slaves.length - ONDEMAND_COUNT : 0;
}

function describeSlaveInstances() {
  return ec2.describeInstancesAsync({
    Filters: [
      {
        Name: 'tag:CI',
        Values: ['slave']
      },
      {
        Name: 'instance-state-name',
        Values: ['running']
      }
    ]
  })
    .then(function(data) {
      var results = [];

      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          results.push(instance);
        });
      });

      return results;
    });
}

function fetchUserData(key) {
  return s3.getObjectAsync({
    Bucket: S3_BUCKET,
    Key: key
  }).then(function(data) {
    return data.Body.toString();
  });
}

function launchOpts(instanceCount, userData) {
  return {
    BlockDeviceMappings: [
      {
        DeviceName: "/dev/xvda",
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: VOLUME_SIZE,
          VolumeType: VOLUME_TYPE
        }
      }
    ],
    DryRun: DRY_RUN,
    ImageId: AMI_ID,
    KeyName: KEY_NAME,
    InstanceType: INSTANCE_TYPE,
    MaxCount: instanceCount,
    MinCount: 1,
    Monitoring: {
      Enabled: true
    },
    NetworkInterfaces: [
      {
        AssociatePublicIpAddress: true,
        DeviceIndex: 0,
        SubnetId: SUBNET_ID,
        Groups: SECURITY_GROUPS
      }
    ],
    UserData: userData
  };
}

function launchOndemandInstances(instanceCount, userData) {
  return ec2.runInstancesAsync(launchOpts(instanceCount, userData));
}

function requestOpts(requestCount, biddingPrice, userData) {
  var validUntil = new Date();
  validUntil.setMinutes(validUntil.getMinutes() + 10);

  return {
    DryRun: DRY_RUN,
    InstanceCount: requestCount,
    LaunchSpecification: {
      BlockDeviceMappings: [
        {
          DeviceName: "/dev/xvda",
          Ebs: {
            DeleteOnTermination: true,
            VolumeSize: VOLUME_SIZE,
            VolumeType: VOLUME_TYPE
          }
        }
      ],
      ImageId: AMI_ID,
      KeyName: KEY_NAME,
      InstanceType: INSTANCE_TYPE,
      Monitoring: {
        Enabled: true
      },
      NetworkInterfaces: [
        {
          AssociatePublicIpAddress: true,
          DeviceIndex: 0,
          SubnetId: SUBNET_ID,
          Groups: SECURITY_GROUPS
        }
      ],
      UserData: userData
    },
    SpotPrice: biddingPrice.toString(),
    ValidUntil: validUntil
  };
}

function requestSpotInstances(requestCount, biddingPrice, userData) {
  return ec2.requestSpotInstancesAsync(requestOpts(requestCount, biddingPrice, userData));
}

exports.handler = function(event, context) {
  Promise.resolve()
    .then(function() {
      return Promise.all([
        describeSlaveInstances()
          .then(function(slaves) {
            return calculateLaunchCounts(slaves);
          }),
        calculateBiddingPrice(),
        fetchUserData(USER_DATA)
      ]);
    })
    .then(function(results) {
      var requestCount = results[0];
      var biddingPrice = results[1];
      var userData = results[2];

      return biddingPrice > 0 ?
        requestSpotInstances(requestCount, biddingPrice, userData) : launchOndemandInstances(requestCount, userData);
    })
    .then(function(data) {
      if (data.SpotInstanceRequests) {
        data.SpotInstanceRequests.forEach(function(request) {
          console.log(request.SpotInstanceRequestId);
        });
      } else {
        data.Instances.forEach(function(instance) {
          console.log(instance.InstanceId);
        });
      }
    })
    .then(function() {
      context.succeed('success!');
    })
    .catch(function(err) {
      context.fail(err.stack);
    });
};
