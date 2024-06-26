import 'reflect-metadata';
import { Context } from 'koa';
import { Opt } from '../index';

export type IRoute = {
  path: string;
  method: string;
  fn: () => void;
  auth: boolean;
  name: string;
  desc:string
};



export const Module = (opt: Opt = {}): ClassDecorator => {
  return (target: any) => {
    const tname = target.name.replace(/Controller$/, '');
    Reflect.defineMetadata(
      'modulePath',
      `/${opt._path || tname.toLowerCase()}`,
      target
    );
    Reflect.defineMetadata('moduleAuth', opt._auth ?? true, target);
    Reflect.defineMetadata(
      'moduleName',
      opt._name ?? tname.toLowerCase(),
      target
    );
  };
};


export const Get = (opt: Opt = {}): MethodDecorator => {
  return (target: any, key: string | symbol, desctiptor: any) => {
    createRoute(target, key, desctiptor, opt, 'get');
  };
};

export const Post = (opt: Opt = {}): MethodDecorator => {
  return (target: any, key: string | symbol, desctiptor: any) => {
    createRoute(target, key, desctiptor, opt, 'post');
  };
};

export const Put = (opt: Opt = {}): MethodDecorator => {
  return (target: any, key: string | symbol, desctiptor: any) => {
    createRoute(target, key, desctiptor, opt, 'put');
  };
};

export const Delete = (opt: Opt = {}): MethodDecorator => {
  return (target: any, key: string | symbol, desctiptor: any) => {
    createRoute(target, key, desctiptor, opt, 'delete');
  };
};

function createRoute(
  target: any,
  key: string | symbol,
  desctiptor: any,
  opt: Opt,
  type: string
) {
  let modulePath = Reflect.getMetadata('modulePath', target);
  if (!modulePath) {
    modulePath = Reflect.defineMetadata(
      'modulePath',
      `/${target.constructor.name.toLowerCase()}`,
      target.constructor
    );
  }

  const route: IRoute = {
    path: '_path' in opt ? `/${opt._path}` : '', //`/${'_path' in opt ? opt._path : <string>key}`
    method: type,
    fn: desctiptor.value,
    auth: opt._auth ?? true,
    name: opt._name ?? <string>key,
    desc:opt._desc??''
  };
  let routes = Reflect.getMetadata('moduleRoutes', target.constructor);
  !routes && (routes = []);
  routes.push(route);
  Reflect.defineMetadata('moduleRoutes', routes, target.constructor);
}


export const Controller = class {
  ctx!: Context;
}
