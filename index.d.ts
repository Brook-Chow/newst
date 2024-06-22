import Application, {
  Context,
  Middleware,
  BaseRequest,
  BaseContext,
} from 'koa';
import { Server } from 'socket.io';
import { ValidateSubmit } from './dist/utils';
import { CreateServer } from './dist/main';
import { Module, Get, Put, Post, Delete } from './dist/decorator';
import { ClassConstructor } from 'class-transformer';

type Request<T, U> = BaseRequest & { body: T } & { files: U };

type IContext = BaseContext & { permissionRoutes: any[]; socketIO: Server };

type App = Application & { context: IContext };


type Iinstance = {
  _moduleAuth: boolean,
  _routeAuth:boolean,
  _routeName:string,
}

export type NewstContext = Context & { request: Request<any, any>; app: App,instance:Iinstance };

export type Opt = {
  _auth?: boolean;
  _path?: string;
  _name?: string;
  _desc?: string;
};

export type AccessHeader = {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Allow-Methods'?: string;
};

export class Controller {
  ctx: NewstContext;
}

type ControllerType<T extends Controller> = T;

export type ServerOptions = {
  port: number;
  controllers: ControllerType[];
  middlewares?: Middleware[];
  routerMiddwares?: Middleware[];
  socketIoConfig?: {
    unsignedDelay: number;
    jwtSecret: string;
  };
  cors?: AccessHeader;
  staticDir: string;
  uploadConfig: {
    uploadDir: string;
    maxFileSize: number;
    allowExts: string[];
  };
};

export function CreateServer(options: ServerOptions): Application;

export function ValidateSubmit(
  cls: ClassConstructor<unknown>,
  data: object,
  strict?: boolean
): any;

export function Module(opt?: Opt): ClassDecorator;
export function Get(opt?: Opt): MethodDecorator;
export function Put(opt?: Opt): MethodDecorator;
export function Post(opt?: Opt): MethodDecorator;
export function Delete(opt?: Opt): MethodDecorator;

export * from 'socket.io';
export * from 'class-transformer';
export * from 'class-validator';
export * as jwt from 'jsonwebtoken';
