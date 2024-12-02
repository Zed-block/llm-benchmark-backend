import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  Get,
  Param,
  Put,
  Req,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signUp.dto';
import { CurrentUser } from './current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CuurentUser } from './dto/currentUser.dto';

@Controller('auth')
export class AuthController {
  emailService: any;
  constructor(private authService: AuthService) {}

  @Post('/login')
  async signin(
    @Req() req,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.signInWithEmail(dto, res);
  }

  @Post('/resendemail/:email')
  async resendemail(
    @Req() req,
    @Param('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const origin: string = req.get('origin');
    // return await this.authService.resentdokenEMail(origin, email)
  }

  @Post('/register')
  async registerUser(
    @Res() req,
    @Body() userObj: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.register(userObj, res);
  }

  @Put('/account/verification/:token')
  async verifyEmail(
    @Param('token') token: string,
    // @Body() loginDetail: Login_Details,
    @Res({ passthrough: true }) res: Response,
    @Req() req,
  ) {
    return this.authService.verifyEmail(token, res);
  }

  @UseGuards(AuthGuard())
  @Post('/sign-out')
  async signOut(@CurrentUser() user: CuurentUser, @Res() res: Response) {
    return this.authService.signOut(res, user);
  }

  @Post('/forgetpassword')
  async forgetPassword(
    @Res({ passthrough: true }) res: Response,
    @Req() req,
    @Body() body: any,
  ) {
    return await this.authService.verifyEmailPassword(body, res);
  }

  @UseGuards(AuthGuard())
  @Get('/authme')
  async currentUser(
    @CurrentUser() user: CuurentUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    // @ts-ignore
    return this.authService.authMe(user, res);
  }

  
	@Post("/requestnewpassowrd/:email")
	async RequestNewPassword(@Req() req, @Param("email") email: string, @Res({ passthrough: true }) res: Response) {
		const origin: string = req.get("origin")
		return await this.authService.RequestForNewPassword(origin, email)
	}

}
