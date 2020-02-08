import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Joi from '@hapi/joi';

import environment from '../environment';
import * as Users from '../models/User';
import emailService from '../email.service';

declare module '@hapi/hapi' {
  // tslint:disable-next-line: interface-name
  interface UserCredentials extends Users.IDBUser { }
}

export default async (server: Hapi.Server) => {
  console.log('- Loading Auth Module: ');

  //
  // Plugins
  //
  console.log('   - Loading plugins');

  await server.register({
    plugin: require('@hapi/cookie')
  });

  //
  // Auth strategy
  //
  console.log('   - Loading strategy');

  server.auth.strategy('session', 'cookie', {
    cookie: {
      name: 'PASSID',
      isSecure: server.info.uri.startsWith('https'),
      password: environment.COOKIE_SECRET
    },
    validateFunc: async (_: any, session: any) => {
      const account = await Users.findByID(session.id);
      if (!account) {
        return { valid: false };
      }
      return { valid: true, credentials: { user: account } };
    }
  });
  server.auth.default({
    strategies: ['session'],
    mode: 'try'
  });

  //
  // Paths
  //
  console.log('   - Loading routes');

  server.route({
    method: 'POST',
    path: '/register',
    handler: async (req, h) => {
      const { email, first_name, last_name, nickname, password } = req.payload as any;
      if (await Users.isEmailTaken(email)) { return Boom.conflict('Email taken'); }
      // tslint:disable-next-line: no-non-null-assertion
      const user = (await Users.createUser({ email, first_name, last_name, nickname }, password))!;

      // tslint:disable-next-line: no-non-null-assertion
      const token = (await Users.createToken(user))!;
      await emailService.sendMail({
        from: `"No Reply" <${environment.EMAIL_USER}>`,
        to: email,
        subject: 'Verify account',
        text: `To verify click ${environment.BASE_URL}/register/verify-email?token=${token}`
      });
      return Users.view(user);
    },
    options: {
      // Swagger
      description: 'Registers the user',
      tags: ['api', 'auth'],

      // Options
      auth: { mode: 'try' },
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required().trim(),

          first_name: Joi.string().min(3).required().trim(),
          last_name: Joi.string().min(3).required().trim(),
          nickname: Joi.string().trim(),

          password: Joi.string().min(3).required()
        }).required()
      },
      response: { schema: Users.JoiView }
    }
  });

  server.route({
    method: 'GET',
    path: '/register/email-taken',
    handler: async (req, h) => {
      return { taken: await Users.isEmailTaken(req.query.email as string) };
    },
    options: {
      description: 'Checks if email is taken',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'try'
      },
      validate: {
        query: Joi.object({
          email: Joi.string().email().required()
        }),
      },
      response: { schema: Joi.object({ taken: Joi.boolean() }) }
    },
  });

  server.route({
    method: 'GET',
    path: '/register/verify-email',
    handler: async (req, h) => {
      const { token } = req.query;
      if (!(await Users.verifyUserByToken(token as string))) {
        return Boom.preconditionFailed('Invalid token');
      }
      await Users.removeToken(token as string);
      return { success: true };
    },
    options: {
      description: 'Validates the email by using a token',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'try'
      },
      validate: {
        query: Joi.object({
          token: Joi.string().base64({ urlSafe: true }).min(3).required()
        }),
      },
      response: { schema: Joi.object({ success: Joi.boolean() }) }
    }
  });

  server.route({
    method: 'POST',
    path: '/register/resend-email',
    handler: async (req, h) => {
      const { email } = req.payload as any;
      const token = await Users.getTokenForEmail(email as string);
      if (!token) { return Boom.preconditionFailed('There is no token avaliable'); }

      await emailService.sendMail({
        from: `"No Reply" <${environment.EMAIL_USER}>`,
        to: email,
        subject: 'Verify account',
        text: `To verify click ${environment.BASE_URL}/register/verify-email?token=${token}`
      });

      return { success: true };
    },
    options: {
      description: 'Resends token email',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'try'
      },
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required()
        }),
      },
      response: { schema: Joi.object({ success: Joi.boolean() }) }
    }
  });

  server.route({
    method: 'POST',
    path: '/login',
    handler: async (req, h) => {
      // tslint:disable-next-line: no-non-null-assertion
      const user = await Users.findByEmail((req.payload as any).email);
      if (user === null) { return Boom.unauthorized('Username not found'); }

      if (!(await Users.checkPassword(user, (req.payload as any).password))) { return Boom.unauthorized('Bad password'); }
      if (!user.email_verified) { return Boom.forbidden('Email not verified'); }
      req.cookieAuth.set({ id: user.id });



      return Users.view(user);
    },
    options: {
      // Swagger
      description: 'Logges in the user',
      tags: ['api', 'auth'],

      // Options
      auth: { mode: 'try' },
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required().trim(),
          password: Joi.string().min(1).required()
        }).required()
      },
      response: { schema: Users.JoiView }
    }
  });

  server.route({
    method: 'POST',
    path: '/logout',
    handler: async (req, h) => {
      req.cookieAuth.clear();
      return { success: true };
    },
    options: {
      // Swagger
      description: 'Logges out the user',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'required'
      },
      validate: {},
      response: { schema: Joi.object({ success: Joi.boolean() }) }
    }
  });

  server.route({
    method: 'GET',
    path: '/userinfo',
    handler: async (req, h) => {
      // tslint:disable-next-line: no-non-null-assertion
      const user = req.auth.credentials.user!;
      return Users.view(user);
    },
    options: {
      // Swagger
      description: 'Info about the currently loggen in user',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'required'
      },
      validate: {},
      response: { schema: Users.JoiView }
    }
  });
  server.route({
    method: 'POST',
    path: '/userinfo',
    handler: async (req, h) => {
      // tslint:disable-next-line: no-non-null-assertion
      if (!(await Users.updateUser(req.auth.credentials.user!.id, req.payload as any))) {
        return Boom.internal('Failed to update');
      }

      // tslint:disable-next-line: no-non-null-assertion
      return Users.view(req.auth.credentials.user!);
    },
    options: {
      // Swagger
      description: 'Update lgged in users info',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'required'
      },
      validate: {
        payload: Joi.object({
          first_name: Joi.string().min(3),
          last_name: Joi.string().min(3),
          nickname: Joi.string().allow(null),
        })
      },
      response: { schema: Users.JoiView }
    }
  });
  server.route({
    method: 'PUT',
    path: '/userinfo',
    handler: async (req, h) => {
      // tslint:disable-next-line: no-non-null-assertion
      if (!(await Users.updateUser(req.auth.credentials.user!.id, req.payload as any))) {
        return Boom.internal('Failed to update');
      }

      // tslint:disable-next-line: no-non-null-assertion
      return Users.view(req.auth.credentials.user!);
    },
    options: {
      // Swagger
      description: 'Update lgged in users info',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'required'
      },
      validate: {
        payload: Joi.object({
          first_name: Joi.string().min(3).required(),
          last_name: Joi.string().min(3).required(),
          nickname: Joi.string().allow(null).required(),
        }).required()
      },
      response: { schema: Users.JoiView }
    }
  });

  server.route({
    method: 'POST',
    path: '/userinfo/change-password',
    handler: async (req, h) => {
      // tslint:disable-next-line: no-non-null-assertion
      if (!(await Users.checkPassword(req.auth.credentials.user!, (req.payload as any).oldPassword))) {
        return Boom.forbidden('Invalid old password');
      }
      // tslint:disable-next-line: no-non-null-assertion
      await Users.changePassword(req.auth.credentials.user!, (req.payload as any).newPassword);

      return { success: true };
    },
    options: {
      // Swagger
      description: 'Update lgged in users info',
      tags: ['api', 'auth'],

      // Options
      auth: {
        mode: 'required'
      },
      validate: {
        payload: Joi.object({
          oldPassword: Joi.string().required(),
          newPassword: Joi.string().min(3).required()
        }).required()
      },
      response: { schema: Joi.object({ success: Joi.boolean() }) }
    }
  });
};
