# Core Furnace modules

This repo includes some core Furnace modules to be used with the platform.

Right now those modules include:
- **aws-vpcfl:** an AWS VPC flowlogs parser
- **passthrough:** a simple passthrough module
- **elasticsearch:** en Elasticsearch sink using the HTTP/S protocol
- **lookup-port:** enrich event with port name/description based on port number
- **lookup-protocol:** enrich event with protocol name based on its number
- **lookup-geo:** enrich event with geo information based on IPs
- **aws-lookup-sg:** (AWS Specific) enrich event with security group information based on ENI
- **enrc-flatten:** flattens the json event for easier ingestion into redshift etc.

More modules will be added as the project matures.
