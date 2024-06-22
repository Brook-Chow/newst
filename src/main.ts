require('dotenv').config();

import Koa, { Context } from 'koa';
import Router from 'koa-router';
import KoaBody from 'koa-body';
import KoaStatic from 'koa-static';
import { checkJwtForSocket } from './utils';
import path from 'path';
import { ServerOptions } from '../index';

const router = new Router({ strict: true });

type AccessMethod = 'get' | 'put' | 'post' | 'delete';

export const CreateServer = (options: ServerOptions) => {
  let routes = [];
  for (let builder of options.controllers) {
    const instance = {
      moduleName: Reflect.getMetadata('moduleName', builder),
      modulePath: Reflect.getMetadata('modulePath', builder),
      moduleAuth: Reflect.getMetadata('moduleAuth', builder),
      moduleRoutes: Reflect.getMetadata('moduleRoutes', builder),
    };

    if (!instance.moduleRoutes || instance.moduleRoutes.length === 0) {
      continue;
    }
    instance.moduleRoutes.sort(
      (a: any, b: any) => a.path.includes(':') - b.path.includes(':')
    );

    for (let key in instance.moduleRoutes) {
      const path = instance.modulePath + instance.moduleRoutes[key].path;

      routes.push({
        path: path,
        method: instance.moduleRoutes[key].method,
        auth: instance.moduleRoutes[key].auth,
        name: instance.moduleRoutes[key].name,
        pname: instance.moduleName,
        desc:instance.moduleRoutes[key].desc,
      });

      router[<AccessMethod>instance.moduleRoutes[key].method](
        path,
        async (ctx: Context, next: any) => {
          ctx.instance = {
            _moduleAuth: instance.moduleAuth,
            _routeAuth: instance.moduleRoutes[key].auth,
            _routeName: instance.moduleRoutes[key].name,
          };
          await next();
        },
        ...(options.routerMiddwares || []),
        async (ctx: Context, next: any) => {
          try {
            return await instance.moduleRoutes[key].fn.apply({ ctx });
          } catch (error) {
            console.log(error);
            ctx.response.status = 500;
            return (ctx.body = { code: 500, data: null });
          }
        }
      );
    }
  }

  const app = new Koa();
  app
    .use(async (ctx: any, next: any) => {
      if (options.cors) {
        for (let key in options.cors) {
          ctx.set(key, (<any>options.cors)[key]);
        }
      }
      ctx.method === 'OPTIONS' ? (ctx.body = 200) : await next();
    })
    .use(
      KoaBody({
        multipart: true,
        formidable: {
          uploadDir: options.uploadConfig.uploadDir,
          keepExtensions: true,
          maxFileSize: options.uploadConfig.maxFileSize * 1024,
          onFileBegin(_, file) {
            const ext = path.extname(<string>file.originalFilename);
            if (
              !options.uploadConfig.allowExts.includes(
                ext.substring(1).toLowerCase()
              )
            ) {
              throw new Error('not allow ext');
            } else {
              return file;
            }
          },
        },
      })
    )
    .use(KoaStatic(options.staticDir));

  if (options.middlewares) {
    for (const middleware of options.middlewares) {
      app.use(middleware);
    }
  }

  app.use(router.routes()).use(router.allowedMethods());

  let server = app.listen(options.port);

  app.context.permissionRoutes = routes;

  if (options?.socketIoConfig) {
    app.context.socketIO = require('socket.io')(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    app.context.socketIO.on('connection', (socket: any) => {
      console.log('a user connected');
    });

    app.context.socketIO.use((socket: any, next: any) => {
      checkJwtForSocket(
        socket,
        next,
        options.socketIoConfig!.jwtSecret || '',
        options.socketIoConfig!.unsignedDelay
      );
    });
  }
  return app;
};
