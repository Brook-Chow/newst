require('dotenv').config();

import Koa, { Context, Middleware } from 'koa';
import Router from 'koa-router';
import KoaBody from 'koa-body';
import KoaStatic from 'koa-static';
import { checkJwt, signJwt } from './utils';
import path from 'path'
const router = new Router({ strict: true });

type AccessHeader = {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Allow-Methods'?: string;
};

type AccessMethod = 'get' | 'put' | 'post' | 'delete';


export function CreateServer(options: {
  port: number;
  controllers: any[];
  middlewares?: Middleware[];
  jwt?: {
    enable: boolean;
    secret: string;
  };
  socketIoConfig?: {
    allow:boolean,
    unsignedHost:string[],
    unsignedDelay:number
  }
  cors?: AccessHeader;
  staticDir: string;
  uploadConfig:{
    uploadDir: string;
    maxFileSize: number;
    allowExts:string[]
  }
}) {
  let routes = [];
  for (let builder of options.controllers) {

    const instance  = {
      moduleName: Reflect.getMetadata('moduleName', builder),
      modulePath: Reflect.getMetadata('modulePath', builder),
      moduleAuth: Reflect.getMetadata('moduleAuth', builder),
      moduleRoutes: Reflect.getMetadata('moduleRoutes', builder),
    }
    
    if(!instance.moduleRoutes || instance.moduleRoutes.length===0){
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
      });

      router[<AccessMethod>instance.moduleRoutes[key].method](
        path,
        async (ctx: Context, next: any) => {
          console.log(
            '\x1b[44m%s\x1b[0m',
            `[Route] ${instance.moduleRoutes[key].name}  path:${path}  method:${
              instance.moduleRoutes[key].method
            }  ${new Date().toLocaleString()}  `
          );
          Object.keys(ctx.request.body).length > 0 &&
            console.table(ctx.request.body);
          ctx.query && console.table(ctx.query);
          ctx.param && console.table(ctx.param);

          if (
            !options.jwt?.enable ||
            instance.moduleAuth === false ||
            !instance.moduleRoutes[key].auth
          ) {
            await next();
          } else {
            try {
              let { id, email, roleId } = await checkJwt(
                ctx,
                options.jwt?.secret || ''
              );
              ctx.state.user = { id, email, roleId };
              await next();
            } catch (error) {
              console.log(error);
              ctx.response.status = 401;
              return (ctx.body = {
                code: 401,
                message: 'auth fail',
                data: null,
              });
            }
          }
        },
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
          onFileBegin(name, file) {
            let ext = path.extname(<string>file.originalFilename)
            if(options.uploadConfig.allowExts.includes(ext.substring(1).toLowerCase())){
              throw new Error('not allow ext')
            }else{
              return file
            }
          },
        }
       
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

  if (options?.socketIoConfig?.allow) {
    app.context.socketIO = require('socket.io')(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
  
    app.context.socketIO.on('connection', (socket: any) => {
      console.log('a user connected');
    });

    app.context.socketIO.use((socket: any, next: any) => {
      signJwt(socket, next, options.jwt?.secret || '',options.socketIoConfig!.unsignedHost,options.socketIoConfig!.unsignedDelay);
    });

  }
  return app;
}
