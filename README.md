# lambda-smart-autoscaling

Lambda function to launch _cost-optimized_ EC2 instances

## "cost-optimized"

When the Spot Price is much lower, this function tries to request __Spot Instance__. If higher than ondemand price, this function launches __Ondemand Instance__.

Spot bidding strategy is similar to [vimeo's strategy](http://www.slideshare.net/ptrmcrthr/vimeo-ec2/7).

## Local Development

```bash
$ npm install

# Run locally
$ npm run local

# Run linter
$ npm run lint

# Build .zip package
$ npm run build
```
