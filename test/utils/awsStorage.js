const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

class AwsStorage {
  constructor(s3Client) {
    this.s3Client = s3Client
  }

  async getPresignedDownloadUrl(bucketId, key, ttlInSeconds) {
    const command = new GetObjectCommand({
      Bucket: bucketId,
      Key: key,
    })

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: ttlInSeconds,
    })
  }

  async getPresignedUploadUrl(bucketId, key, ttlInSeconds, contentHeaders) {
    const args = {
      Bucket: bucketId,
      Key: key,
    }

    if (typeof contentHeaders?.contentDisposition === 'string') {
      args.ContentDisposition = contentHeaders.contentDisposition
    }
    if (typeof contentHeaders?.contentEncoding === 'string') {
      args.ContentEncoding = contentHeaders.contentEncoding
    }
    if (typeof contentHeaders?.contentType === 'string') {
      args.ContentType = contentHeaders.contentType
    }

    const command = new PutObjectCommand(args)

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: ttlInSeconds,
    })
  }
}

module.exports = {
  AwsStorage,
}
