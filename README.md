# Core Furnace modules

This repo includes some core Furnace modules to be used with the platform.

Right now those modules include:
- **aws-vpcfl:** (AWS Specific) an AWS VPC flowlogs parser
- **passthrough:** a simple passthrough module
- **elasticsearch:** en Elasticsearch sink using the HTTP/S protocol
- **lookup-port:** enrich event with port name/description based on port number
- **lookup-protocol:** enrich event with protocol name based on its number
- **dynamodb:** (AWS Specific) AWS DynamoDB sink. Tablesink is very similar but cross-cloud and it's the preferred choice now
- **tablesink:** cross-cloud table sink (dynamodb/bigtable/azure table storage)
- **lookup-geo:** enrich event with geo information based on IPs
- **aws-lookup-sg:** (AWS Specific) enrich event with security group information based on ENI
- **s3-tap:** (AWS Specific) receive an s3 creation event and send the file contents via a message queue
- **enrc-flatten:** flattens the json event for easier ingestion into redshift etc.

More modules will be added as the project matures.
