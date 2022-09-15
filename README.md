# fastify-s3-buckets
Fastify plugin for ensuring existence of defined AWS S3 buckets on the application startup.

[![NPM Version](https://img.shields.io/npm/v/fastify-s3-buckets.svg)](https://npmjs.org/package/fastify-s3-buckets)
[![Build Status](https://github.com/kibertoad/fastify-s3-buckets/workflows/ci/badge.svg)](https://github.com/kibertoad/fastify-s3-buckets/actions)

## How to use?

```ts
import fastify from 'fastify';
import { fastifyS3BucketsPlugin } from 'fastify-s3-buckets';
import { S3Client } from '@aws-sdk/client-s3'

const s3Config = {
    endpoint: 'http://s3.localhost.localstack.cloud:4566',
    region: 'eu-west-1',
    credentials: {
        accessKeyId: 'access',
        secretAccessKey: 'secret',
    },
}
const s3Client = new S3Client(s3Config)

const app = fastify()
app.register(fastifyS3BucketsPlugin, {
    s3Client,
    buckets: [
        { Bucket: 'abc', ACL: 'private' },
        { Bucket: 'def', ACL: 'public-read' },
        { Bucket: 'ghi', ACL: 'private' }
    ],
})
await app.ready() // missing buckets will be created here

```

Note that if buckets already exist, they will not be recreated.
Existing buckets that are not specified will not be deleted.
