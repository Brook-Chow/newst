import jwt from 'jsonwebtoken';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const ValidateSubmit = async (
  cls: ClassConstructor<unknown>,
  data: any,
  strict = true
) => {
  const obj = <object>plainToInstance(cls, data, {
    // excludeExtraneousValues: true,
  });
  const res = { status: true, errMsg: '' };

  // console.log(Object.keys(obj));

  // if(strict && !Object.keys(data).every(key => Object.keys(obj).includes(key))){
  //   res.status = false;
  //   res.errMsg = `some param is not a valid field`;
  //   return res;
  // }

  const valid = await validate(obj);

  if (valid.length > 0) {
    res.status = false;
    res.errMsg = Object.values(valid[0].constraints as object)[0];
  }
  return res;
};

export const checkJwtForSocket = async (
  socket: any,
  next: any,
  secret: string,
  unsignedDelay: number
) => {
  const token = socket.handshake.headers.authorization;
  if (token) {
    jwt.verify(token.split(' ')[1], secret, async (err: any, decoded: any) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.decoded = decoded;
      return await next();
    });
  } else {
    if (!socket.handshake.query.cert) {
      return next(new Error('Authentication error'));
    }

    socket.decoded = { id: socket.handshake.query.cert };

    const disconnectTimer = setTimeout(() => {
      socket.disconnect(true);
    }, unsignedDelay * 1000);

    socket.on('disconnect', function () {
      clearTimeout(disconnectTimer);
    });

    return await next();
  }
};
