import { FastifyPluginCallback } from 'fastify'
import type { S3ClientConfig } from '@aws-sdk/client-s3/'
import { S3Client } from '@aws-sdk/client-s3'
import { CreateBucketCommandInput } from '@aws-sdk/client-s3/dist-types/commands/CreateBucketCommand'

declare module 'fastify' {
  interface FastifyInstance {
    s3Client: S3Client
  }
}

export type BucketConfiguration = CreateBucketCommandInput

export interface BaseFastifyS3BucketsOptions {
  buckets: readonly BucketConfiguration[]
}

export interface FastifyS3BucketsOptionsWithConfig extends BaseFastifyS3BucketsOptions {
  s3Config: S3ClientConfig
}

export interface FastifyS3BucketsOptionsWithClient extends BaseFastifyS3BucketsOptions {
  s3Client: S3Client
}

export const fastifyS3BucketsPlugin: FastifyPluginCallback<
  NonNullable<FastifyS3BucketsOptionsWithClient | FastifyS3BucketsOptionsWithConfig>
>
