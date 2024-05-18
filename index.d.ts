/// <reference path="../index.d.ts" />

import Application, { Context, Middleware, BaseRequest, BaseContext } from 'koa';
import {Server} from 'socket.io'
import { ValidateSubmit } from './dist/utils';
import { CreateServer } from './dist/main';
import { Module, Get, Put, Post, Delete } from './dist/decorator';
import { ClassConstructor } from 'class-transformer';

type Request<T, U> = BaseRequest & { body: T } & { files: U };


type IContext = BaseContext & { permissionRoutes: any[], socketIO: Server };

type App = Application & { context: IContext };

type NewstContext = Context & { request: Request<any, any>, app:App};


type Opt = {
  _auth?: boolean;
  _path?: string;
  _name?: string;
};

export type AccessHeader = {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Allow-Methods'?: string;
};

export interface ControllerType {
  new (): Controller;
}


export function CreateServer(options: {
  port: number;
  controllers: ControllerType[];
  middlewares?: Middleware[];
  routerMiddwares?: Middleware[];
  jwt?: {
    enable: boolean;
    secret: string;
    fields:string[]
  };
  socketIoConfig?: {
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
