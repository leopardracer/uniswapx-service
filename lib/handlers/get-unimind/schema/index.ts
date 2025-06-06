import Joi from 'joi'
import { QuoteMetadata } from '../../../repositories/quote-metadata-repository'

// Route struct we expect after parsing
const routeSchema = Joi.object({
  quote: Joi.string().required(),
  quoteGasAdjusted: Joi.string().required(),
  gasPriceWei: Joi.string().required(),
  gasUseEstimateQuote: Joi.string().required(),
  gasUseEstimate: Joi.string().required(),
  methodParameters: Joi.object({
    calldata: Joi.string().required(),
    value: Joi.string().required(),
    to: Joi.string().required()
  }).required()
})

export const unimindQueryParamsSchema = Joi.object({
  quoteId: Joi.string().required(),
  pair: Joi.string().required(),
  referencePrice: Joi.string().required(),
  priceImpact: Joi.number().required(),
  blockNumber: Joi.number().optional(),
  route: Joi.string()
    .optional()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value)
        const { error } = routeSchema.validate(parsed)
        if (error) {
          return helpers.error('string.routeInvalid')
        }
        return value
      } catch (err) {
        return helpers.error('string.invalidJson')
      }
    }, 'validate route JSON')
    .messages({
      'string.invalidJson': 'route must be a valid JSON string',
      'string.routeInvalid': 'route structure is invalid after parsing'
    }),
  logOnly: Joi.boolean().optional()
    .truthy('true')
    .falsy('false')
    .sensitive(),
    // All other values are rejected for a 400 error
  swapper: Joi.string().optional()
})

export type UnimindQueryParams = Omit<QuoteMetadata, 'route'> & {
  route: string, // route is now a JSON string to be used as a GET query param
  logOnly?: boolean,
  swapper?: string
}
