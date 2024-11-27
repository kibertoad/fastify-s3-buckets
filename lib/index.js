const fp = require('fastify-plugin')
const { S3Client, ListBucketsCommand, CreateBucketCommand } = require('@aws-sdk/client-s3')

function plugin(fastify, opts, next) {
  const s3Client = opts.s3Client || new S3Client(opts.s3Config)
  const buckets = opts.buckets

  fastify.decorate('s3Client', s3Client)

  fastify.addHook('onReady', async () => {
    const listBucketsCommand = new ListBucketsCommand({})
    const bucketsList = await s3Client.send(listBucketsCommand)
    const bucketsNames = bucketsList.Buckets.map((bucketEntry) => {
      return bucketEntry.Name
    })

    const bucketsToCreate = buckets.filter((bucketEntry) => {
      return !bucketsNames.includes(bucketEntry.Bucket)
    })

    for (let bucket of bucketsToCreate) {
      const createBucketCommand = new CreateBucketCommand(bucket)
      await s3Client.send(createBucketCommand)
    }
  })

  fastify.addHook('onClose', (instance, done) => {
    s3Client.destroy()
    done()
  })

  next()
}

const fastifyS3BucketsPlugin = fp(plugin, {
  fastify: '5.x',
  name: 'fastify-s3-buckets',
})

module.exports = {
  fastifyS3BucketsPlugin,
}
