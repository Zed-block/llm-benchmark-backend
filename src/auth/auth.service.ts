/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { SignUpDto } from './dto/signUp.dto';
// import { Mailer } from '../utils/email/email.mailer';
import { User, UserDocument } from '../user/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CuurentUser } from './dto/currentUser.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private emailService: EmailService,
    private userService: UserService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async resendtokenEMail(email: string) {
    try {
      const userObj = await this.userModel.findOne({ email: email });

      if (!userObj) {
        throw new BadRequestException('Email not Exist');
      }

      // const isEmailSent: boolean = await this.verifyEmailRequest(userObj);
      // console.log('IsEmail sent ==>', isEmailSent);

      return 'User Created';
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async signInWithEmail(dto: LoginDto, res: Response) {
    try {
      const valid: boolean = await this.verifyUser(dto.email, dto.password);
      if (!valid) throw new BadRequestException('Incorrect password');
      let user = await this.userService.getUserByEmail(dto.email);

      if (!user.isEmailVerified) {
        throw new BadRequestException('Email is not verified');
      }

      const token = await this.jwtService.signAsync(
        { userId: user._id },
        {
          expiresIn: '365d',
        },
      );

      let { password, ...rest } = user.toObject();
      res
        .cookie('authorization', `Bearer ${token}`, {
          httpOnly: true,
          secure: true,
          maxAge: Date.now() + 10 * 365 * 24 * 60 * 60,
          sameSite: 'none',
        })
        .json({ ...rest, token });
    } catch (err: any) {
      throw new BadRequestException(err?.message)
    }
  }

  async authMe(currentUser: CuurentUser, res) {
    try {
      let user = await this.userService.getUserByEmail(currentUser.email);

      const token = await this.jwtService.signAsync(
        { userId: user._id },
        {
          expiresIn: '365d',
        },
      );

      let { password, ...rest } = user.toObject();

      // res
      //   .cookie('authorization', `Bearer ${token}`, {
      //     httpOnly: true,
      //     secure: true,
      //     maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // Ensure maxAge is in milliseconds
      //     sameSite: 'none',
      //   })
      //   .json({ ...rest, token });

      // Explicitly return after sending the response
      return rest
    } catch (err: any) {
      console.log('err at auth me');
      throw new BadRequestException(err.message);
    }
  }

  async verifyUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email });
    if (!user) throw new BadRequestException('Incorrect email');
    if (!user.password)
      throw new BadRequestException(
        'Yours account does not have any password, please create a new one password with forgot password',
      );

    return await bcrypt.compare(password, user.password);
  }

  async register(userObj: SignUpDto, res: Response) {
    try {
      const userExist = await this.userModel.findOne({ email: userObj.email });

      if (userExist) {
        throw new BadRequestException('Email already exist');
      }

      const encryptedPassword = (userObj.password = bcrypt.hashSync(
        userObj.password,
      ));

      userObj.password = encryptedPassword;

      const user = await this.userModel.create({
        ...userObj,
      });

      this.verifyEmailRequest(
        `${process.env.FRONTEND_BASE_URL}/${process.env.TOKEN_VERIFICATION}`,
        user,
      );

      res.json(user);
    } catch (err: any) {
      console.log('err', err.message);
      throw new BadRequestException({ message: err.message });
    }
  }

  async verifyEmailRequest(origin, user): Promise<boolean> {
    try {
      const token = await this.jwtService.signAsync(
        { email: user.email, verifyEmail: true },
        {
          expiresIn: '30d',
        },
      );
      const verifyEmailUrl = `${origin}?token=${token}`;
      await this.emailService.verificatoinEmail(
        user?.email,
        user?.firstName,
        verifyEmailUrl,
      );
    } catch (error) {
      console.log('Error in verifyEmailRequest: ', error);
      return false;
    }
  }

  //   sign up store the divece details
  async verifyEmail(jwtToken: string, res: Response) {
    try {
      const decodedObj = await this.jwtService.verifyAsync(jwtToken);
      if (!decodedObj['verifyEmail']) {
        throw new BadRequestException(
          'Token is Invalid Or Expired Please try again',
        );
      }

      let user = await this.userModel.findOne({
        email: decodedObj['email'],
      });

      if (!user) {
        throw new BadRequestException('User Does not exist');
      }

      user = await this.userModel.findOneAndUpdate(
        { email: user.email },
        { $set: { isEmailVerified: true } },
      );
      return user;
    } catch (err) {
      throw new BadRequestException(
        'Token is Invalid Or Expired Please try again',
      );
    }
  }

  async verifyEmailPassword(body, res) {
    try {
      const decodedObj: any = await this.jwtService.verifyAsync(body.token);
      if (!decodedObj['verifyEmailForPassword']) {
        throw new BadRequestException('Invalid Token');
      }

      let user = await this.userModel.findById(decodedObj?.userId);
      if (!user) {
        throw new BadRequestException('User Not Found');
      }

      const encryptedPassword = (body.password = bcrypt.hashSync(
        body.password,
      ));

      user = await this.userModel.findOneAndUpdate(
        { email: user.email },
        { $set: { password: encryptedPassword } },
        {
          new: true,
          upsert: true,
        },
      );
      console.log('user: ', user);
      return 'password updated';
    } catch (error) {}
  }

  async verifyPassword(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new BadRequestException('Incorrect username or password');
    return await bcrypt.compare(password, user.password);
  }

  async signOut(res: Response, user) {
    try {
      res.cookie('authorization', `Bearer `, {
        httpOnly: true,
        secure: true,
        maxAge: 0,
        sameSite: 'none',
      });
      res.end();

      return { error: false, message: 'Sign out successfully' };
    } catch (err: any) {
      return { error: true, message: err.message };
    }
  }

  async RequestForNewPassword(origin: string, email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email: email });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    try {
      const token = await this.jwtService.signAsync(
        { userId: user._id, verifyEmailForPassword: true },
        {
          expiresIn: '30d',
        },
      );

      const verifyEmailUrl = `${process.env.FRONTEND_BASE_URL}/${process.env.CREATE_PASSWORD}?token=${token}`;

      let emailer = await this.emailService.ForgetPassword(
        user?.email,
        user?.firstName,
        verifyEmailUrl,
      );

      console.log('emailer: ', emailer);
      if (!emailer) {
        throw new BadRequestException('Error sending mail');
      }

      return emailer;
    } catch (error) {
      console.log('Error in verifyEmailRequest: ', error);
      throw new BadRequestException('Error sending mail');
    }
  }
}
