const fastify = require('fastify')
const { fastifyS3BucketsPlugin } = require('../lib')
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3')
const { S3TestHelper } = require('s3-test-helper')

const s3Config = {
  endpoint: 'http://s3.localhost.localstack.cloud:4566',
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'access',
    secretAccessKey: 'secret',
  },
}
const s3Client = new S3Client(s3Config)

describe('fastifyS3BucketsPlugin', () => {
  let s3TestHelper
  beforeEach(async () => {
    s3TestHelper = new S3TestHelper(s3Client)
    await s3TestHelper.deleteBucket('abc')
    await s3TestHelper.deleteBucket('def')
    await s3TestHelper.deleteBucket('ghi')
  })
  afterEach(async () => {
    await s3TestHelper.cleanup()
  })

  it('creates buckets on app startup', async () => {
    const app = fastify()
    app.register(fastifyS3BucketsPlugin, {
      s3Client,
      buckets: [{ Bucket: 'abc' }, { Bucket: 'def' }, { Bucket: 'ghi' }],
    })
    await app.ready()

    const bucketsList = await s3TestHelper.listBuckets()
    const bucketsNames = bucketsList.map((bucketEntry) => {
      return bucketEntry.Name
    })

    expect(bucketsNames).toEqual(['abc', 'def', 'ghi'])
  })

  it('avoids creating existing buckets', async () => {
    await s3TestHelper.createBucket('def')
    await s3TestHelper.createBucket('xyz')

    const app = fastify()
    app.register(fastifyS3BucketsPlugin, {
      s3Config,
      buckets: [{ Bucket: 'abc' }, { Bucket: 'def' }, { Bucket: 'ghi' }],
    })
    await app.ready()

    const bucketsList = await s3TestHelper.listBuckets()
    const bucketsNames = bucketsList.map((bucketEntry) => {
      return bucketEntry.Name
    })

    expect(bucketsNames).toEqual(['def', 'xyz', 'abc', 'ghi'])
  })

  it('closes connection without throwing an error', async () => {
    const app = fastify()
    app.register(fastifyS3BucketsPlugin, {
      s3Client,
      buckets: [],
    })
    await app.ready()
    await app.close()
  })
})
