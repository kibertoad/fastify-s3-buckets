import fastify, { FastifyInstance } from 'fastify'
import type { BaseFastifyS3BucketsOptions } from './index'
import { fastifyS3BucketsPlugin } from './index'

import { expectAssignable,  expectType } from 'tsd'
import { S3Client } from '@aws-sdk/client-s3'

expectAssignable<BaseFastifyS3BucketsOptions>({ buckets: [] })

const s3Config = {
  endpoint: 'http://s3.localhost.localstack.cloud:4566',
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'access',
    secretAccessKey: 'secret',
  },
}
const s3Client = new S3Client(s3Config)
const app: FastifyInstance = fastify()

app.register(fastifyS3BucketsPlugin, { buckets: [], s3Client })
app.register(fastifyS3BucketsPlugin, { buckets: [], s3Config })
app.register(fastifyS3BucketsPlugin, {
  buckets: [
    {
      Bucket: 'dummyBucket',
    },
  ],
  s3Config,
})

expectType<S3Client>(app.s3Client)
