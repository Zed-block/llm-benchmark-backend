import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import * as Jwt from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface ExtractedToken {
  token: string | null;
}

const cookieExtractor = (req): ExtractedToken => {
  let token = null;
  if (req && req.cookies && req.cookies['authorization']) {
    const authorization = req.cookies['authorization'];
    if (authorization) token = authorization.replace('Bearer ', '');
  } else if (req && req.headers && req?.headers?.apikey) {
    token = req?.headers?.apikey.replace('Bearer ', '');
  } else {
    const authorization = req?.headers?.authorization;
    if (authorization) token = authorization.replace('Bearer ', '');
  }
  console.log('token: ', token);
  return { token };
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userSerive: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET'),
      jwtFromRequest: (req): string | null => {
        const { token } = cookieExtractor(req);
        return token;
      },
    });
  }

  async validate(payload: { userId: any }): Promise<Record<string, any>> {
    const { userId } = payload;
    const user = await this.userSerive.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not unauthorized');
    }

    const { password, ...rest } = user.toObject();


    return rest;
  }
}
