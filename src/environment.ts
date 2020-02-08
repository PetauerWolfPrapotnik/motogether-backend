require('dotenv').config();
import Joi from '@hapi/joi';

export interface IEnv {
  ENV: string;
  DEBUG: boolean;

  PORT: number;
  BASE_URL: string;

  COOKIE_SECRET: string[];

  POSTGRESQL_URI: string;

  EMAIL_URL: string;
  EMAIL_PORT: number;
  EMAIL_SECURE: boolean;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
};

export const Schema = Joi.object<IEnv, IEnv>({
  ENV: Joi.string().allow('development', 'production').default('development'),
  DEBUG: Joi.boolean().default(false),

  PORT: Joi.number().port().default(3000),
  BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] }),

  COOKIE_SECRET: Joi.string().min(32).required(),

  POSTGRESQL_URI: Joi.string().uri().required(),

  EMAIL_URL: Joi.string().required(),
  EMAIL_PORT: Joi.number().port().required(),
  EMAIL_SECURE: Joi.boolean().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
}).required();

// Validation
const { error, value } = Schema.validate(process.env, { stripUnknown: true, allowUnknown: true });
if (error) throw error;

// Post presets
if (!value.BASE_URL) { value.BASE_URL = `http://localhost:${value.PORT}`; }

// DEBUG
if (value.DEBUG) {
  console.log('Environment settings are:');
  console.log(JSON.stringify(value, null, 2));
}

export default value as IEnv;
