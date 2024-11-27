const fastify = require('fastify')
const { fastifyS3BucketsPlugin } = require('../lib')
const { S3Client } = require('@aws-sdk/client-s3')
const { S3TestHelper } = require('s3-test-helper')
const { AwsStorage } = require('./utils/awsStorage')
const { Client } = require('undici')

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
  }, 10000)

  it('closes connection without throwing an error', async () => {
    const app = fastify()
    app.register(fastifyS3BucketsPlugin, {
      s3Client,
      buckets: [],
    })
    await app.ready()
    await app.close()
  })

  it('content from created buckets can be downloaded and uploaded correctly', async () => {
    const app = fastify()
    app.register(fastifyS3BucketsPlugin, {
      s3Client,
      buckets: [{ Bucket: 'source' }, { Bucket: 'target' }],
    })
    await app.ready()
    const awsStorage = new AwsStorage(s3Client)
    const originalPayload = { id: 1 }

    const getUploadUrl = await awsStorage.getPresignedUploadUrl('source', 'file', 99999)
    const uploadUrl = new URL(getUploadUrl)
    const clientSource = new Client(`${uploadUrl.protocol}//${uploadUrl.host}`)
    const uploadResponse = await clientSource.request({
      method: 'PUT',
      path: uploadUrl.pathname,
      query: uploadUrl.searchParams,
      body: Buffer.from(JSON.stringify(originalPayload)),
    })
    expect(uploadResponse.statusCode).toEqual(200)

    const getDownloadUrl = await awsStorage.getPresignedDownloadUrl('source', 'file')
    const downloadUrl = new URL(getDownloadUrl)
    const downloadResponse = await clientSource.request({
      method: 'GET',
      path: downloadUrl.pathname,
      query: downloadUrl.searchParams,
    })

    const getUploadUrl2 = await awsStorage.getPresignedUploadUrl('target', 'file', 99999)
    const uploadUrl2 = new URL(getUploadUrl2)
    const clientTarget = new Client(`${uploadUrl2.protocol}//${uploadUrl2.host}`)
    const upload2Response = await clientTarget.request({
      method: 'PUT',
      path: uploadUrl2.pathname,
      query: uploadUrl2.searchParams,
      body: downloadResponse.body,
    })
    expect(upload2Response.statusCode).toEqual(200)

    const getDownloadUrl2 = await awsStorage.getPresignedDownloadUrl('target', 'file')
    const downloadUrl2 = new URL(getDownloadUrl2)
    const downloadResponse2 = await clientTarget.request({
      method: 'GET',
      path: downloadUrl2.pathname,
      query: downloadUrl2.searchParams,
    })
    const finalPayload = await downloadResponse2.body.json()
    expect(finalPayload).toEqual(originalPayload)

    await s3TestHelper.deleteBucket('source')
    await s3TestHelper.deleteBucket('target')
  })
})
