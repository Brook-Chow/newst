import Application, { Context, Middleware, BaseRequest, BaseContext } from 'koa';
import {Server} from 'socket.io'
import { ValidateSubmit } from './dist/utils';
import { CreateServer } from './dist/main';
import { Module, Get, Put, Post, Delete } from './dist/decorator';
import { ClassConstructor } from 'class-transformer';

interface Request extends BaseRequest {
  body: any;
  files: any;
}
 
interface IContext extends BaseContext {
  permissionRoutes:any[]
  socketIO:Server
}

interface App extends Application {
  context:IContext
}

interface NewstContext extends Context {
  verifyParams: (arg0: object) => Promise<any>;
  request: Request;
  app:App
}

type Opt = {
  _auth?: boolean;
  _path?: string;
  _name?: string;
};
type AccessHeader = {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Allow-Methods'?: string;
};

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
}): Application;

export function ValidateSubmit(
  cls: ClassConstructor<unknown>,
  data: object
): any;

export function Module(opt?: Opt): ClassDecorator;
export function Get(opt?: Opt): MethodDecorator;
export function Put(opt?: Opt): MethodDecorator;
export function Post(opt?: Opt): MethodDecorator;
export function Delete(opt?: Opt): MethodDecorator;

export class Controller {
  ctx: NewstContext;
  moduleAuth: boolean;
  modulePath: string;
  moduleName: string;
}

export * from 'socket.io'
export * from 'class-validator';
export * as jwt from 'jsonwebtoken';
