# KnowMyStatus API
The API Gateway + Lambda stack that serves the [KnowMyStatus](https://knowmystat.us) web application. Deployment managed by [serverless](https://www.serverless.com/). The backing DynamoDB table uses a geospatial hash index for fast and low-cost queries based on geographical location. 


## API Endpoints
### /list
Return all of the clinics that are within a given radius of a provided geo point. Items in the table have a primary hash key comprised of it's truncated geohash and globally unique ID. This index allows for very fast and low-cost querying of clinics based on their geographical location.

### /get
Return a single clinic by ID. This data is queried using a global secondary index (GSI) as the table's primary index is used for geospatial queries (see above).

## Local Scripts

### Build typescript source into javascript
```
npm run build
```

### Deploy code to Lambda + API Gateway 
```
npm run deploy --stage [beta|production]
```