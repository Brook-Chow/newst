import { Context } from 'koa';
import jwt from 'jsonwebtoken';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export function checkJwt(ctx: Context, secret: string) {
  const authError = {
    code: 401,
    message: 'auth fail',
    data: null,
  };
  return new Promise<any>((resolve, reject) => {
    if (!ctx.header || !ctx.header.authorization) {
      reject(authError);
    }
    const token = ctx.header.authorization?.split(' ')[1] || false;

    if (!token) {
      reject(authError);
    }

    jwt.verify(<string>token, secret, async function (err, decoded) {
      err ? reject(authError) : resolve(decoded);
    });
  });
}

export async function ValidateSubmit(
  cls: ClassConstructor<unknown>,
  data: object
) {
  let obj = <object>plainToInstance(cls, data);
  let valid = await validate(obj);
  let res = { status: true, errMsg: '' };
  if (valid.length > 0) {
    res.status = false;
    res.errMsg = Object.values(valid[0].constraints as object)[0];
  }
  return res;
}

export function signJwt(
  socket: any,
  next: any,
  secret: string,
  unsignedHost: string[],
  unsignedDelay: number
) {
  const token = socket.handshake.headers.authorization;
  if (token) {
    jwt.verify(token.split(' ')[1], secret, (err: any, decoded: any) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.decoded = decoded;
      next();
    });
  } else {
    const clientHost = new URL(socket.handshake.headers.origin).host;

    if (!unsignedHost.includes(clientHost)) {
      return next(new Error('Authentication error'));
    }
    if(!socket.handshake.query.cert){
      return next(new Error('Authentication error'));
    }

    socket.decoded = { id: socket.handshake.query.cert};

    let disconnectTimer = setTimeout(() => {
      socket.disconnect(true);
    }, unsignedDelay * 1000);

    socket.on('disconnect', function () {
      clearTimeout(disconnectTimer);
    });

    next();
  }
}
