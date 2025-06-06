import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import Logger from 'bunyan'
import { Entity, Table } from 'dynamodb-toolbox'
import { DYNAMODB_TYPES } from '../config/dynamodb'
import { TABLE_NAMES } from './util'

interface MethodParameters {
    calldata: string
    value: string
    to: string
}

export interface Route {
    quote: string
    quoteGasAdjusted: string
    gasPriceWei: string
    gasUseEstimateQuote: string
    gasUseEstimate: string
    methodParameters: MethodParameters
}

export interface QuoteMetadata {
  quoteId: string
  referencePrice: string
  priceImpact: number
  blockNumber: number
  route: Route
  pair: string
  usedUnimind: boolean
}

export interface QuoteMetadataRepository {
  put(values: QuoteMetadata): Promise<void>
  getByQuoteId(quoteId: string): Promise<QuoteMetadata | undefined>
}

export class DynamoQuoteMetadataRepository implements QuoteMetadataRepository {
  private readonly entity: Entity

  static create(documentClient: DocumentClient): QuoteMetadataRepository {
    const log = Logger.createLogger({
      name: 'QuoteMetadataRepository',
      serializers: Logger.stdSerializers,
    })

    const table = new Table({
      name: TABLE_NAMES.QuoteMetadata,
      partitionKey: 'quoteId',
      DocumentClient: documentClient,
    })

    const entity = new Entity({
    name: 'QuoteMetadata',
      attributes: {
        quoteId: { partitionKey: true, type: DYNAMODB_TYPES.STRING },
        referencePrice: { type: DYNAMODB_TYPES.STRING, required: true },
        priceImpact: { type: DYNAMODB_TYPES.NUMBER, required: true },
        pair: {type: DYNAMODB_TYPES.STRING, required: true},
        blockNumber: {type: DYNAMODB_TYPES.NUMBER, required: false},
        route: {type: DYNAMODB_TYPES.MAP, required: false},
        usedUnimind: {type: DYNAMODB_TYPES.BOOLEAN, required: true}
      },
      table,
    } as const)

    return new DynamoQuoteMetadataRepository(entity, log)
  }

  constructor(entity: Entity, private readonly log: Logger) {
    this.entity = entity
  }

  async put(values: QuoteMetadata): Promise<void> {
    try {
      await this.entity.put(values)
    } catch (error) {
      this.log.error({ error, values }, 'Failed to put quote metadata')
      throw error
    }
  }

  async getByQuoteId(quoteId: string): Promise<QuoteMetadata | undefined> {
    const result = await this.entity.get({ quoteId }, { execute: true })
    return result.Item as QuoteMetadata | undefined
  }
} 
