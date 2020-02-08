import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Joi from '@hapi/joi';

import environment from '../environment';
import * as Path from '../models/Path';

export default async (server: Hapi.Server) => {
  console.log('- Loading Auth Module: ');

  //
  // Paths
  //
  console.log('   - Loading routes');

  server.route({
    method: 'GET',
    path: '/path',
    handler: async (req, h) => {
      const paths = await Path.getPaths({
        limit: (req.query as any).limit,
        skip: (req.query as any).skip
      });
      console.log(paths);

      return paths.map(Path.view);
    },

    options: {
      // Swagger
      description: 'Get a list of avaliable paths',
      tags: ['api', 'path'],

      auth: {
        mode: 'required'
      },
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().min(1).max(100).default(30),
          skip: Joi.number().integer().min(0).default(0),
        })
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/path',
    handler: async (req, h) => {
      // tslint:disable-next-line: no-non-null-assertion
      return Path.view(await Path.createPath(req.payload as any, req.auth.credentials.user!));
    },

    options: {
      // Swagger
      description: 'Create a path',
      tags: ['api', 'path'],

      auth: {
        mode: 'required'
      },
      validate: {
        payload: Joi.object({
          title: Joi.string().required(),
          description: Joi.string().required().allow(null),

          start_date: Joi.string().isoDate().required(),

          location_start: Path.JoiLocation.required(),
          location_end: Path.JoiLocation.required(),
        }).required()
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/path/{id}',
    handler: async (req, h) => {
      const path = await Path.getPath((req.params as any).id);
      if (!path) { return Boom.notFound('Path not found'); }

      // tslint:disable-next-line: no-non-null-assertion
      return Path.view(path);
    },

    options: {
      // Swagger
      description: 'Get path',
      tags: ['api', 'path'],

      auth: {
        mode: 'required'
      },
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required()
        })
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/path/{id}',
    handler: async (req, h) => {
      // if((await Path.getPaths((req.params as any).id)) ===)

      const path = await Path.updatePath((req.params as any).id, req.payload as any);
      if (!path) { return Boom.notFound('Path not found'); }

      // tslint:disable-next-line: no-non-null-assertion
      return path;
    },

    options: {
      // Swagger
      description: 'Get path',
      tags: ['api', 'path'],

      auth: {
        mode: 'required'
      },
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required()
        }),
        payload: Joi.object({
          title: Joi.string(),
          description: Joi.string().allow(null),

          start_date: Joi.string().isoDate(),

          location_start: Path.JoiLocation,
          location_end: Path.JoiLocation,
        }).required()
      }
    }
  });
  server.route({
    method: 'PUT',
    path: '/path/{id}',
    handler: async (req, h) => {
      const path = await Path.updatePath((req.params as any).id, req.payload as any);
      if (!path) { return Boom.notFound('Path not found'); }

      // tslint:disable-next-line: no-non-null-assertion
      return path;
    },

    options: {
      // Swagger
      description: 'Get path',
      tags: ['api', 'path'],

      auth: {
        mode: 'required'
      },
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required()
        }),
        payload: Joi.object({
          title: Joi.string().required(),
          description: Joi.string().allow(null).required(),

          start_date: Joi.string().isoDate().required(),

          location_start: Path.JoiLocation.required(),
          location_end: Path.JoiLocation.required(),
        }).required()
      }
    }
  });
  server.route({
    method: 'DELETE',
    path: '/path/{id}',
    handler: async (req, h) => {
      const path = await Path.deletePath((req.params as any).id);
      if (!path) { return Boom.notFound('Path not found'); }
      return Path.view(path);
    },

    options: {
      // Swagger
      description: 'Get path',
      tags: ['api', 'path'],

      auth: {
        mode: 'required'
      },
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required()
        }),
        payload: Joi.object({
          title: Joi.string().required(),
          description: Joi.string().allow(null).required(),

          start_date: Joi.string().isoDate().required(),

          location_start: Path.JoiLocation.required(),
          location_end: Path.JoiLocation.required(),
        }).required()
      }
    }
  });

};
