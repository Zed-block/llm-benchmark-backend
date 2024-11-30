import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as ejs from 'ejs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { EmailDTO, WaitingUsers } from './types';
let ObjectId = require('mongodb').ObjectId;

const auth = new google.auth.OAuth2({
  clientId: process.env.EMAIL_CLIENT_ID,
  clientSecret: process.env.EMAIL_CLIENT_SECRET,
  redirectUri: process.env.EMAIL_REDIRECT_URL,
});

@Injectable()
export class EmailService {
  transporter: Transporter;
  constructor() {
    const SMTP_HOST = 'smtp.postmarkapp.com';
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'deba9232-4e71-4720-b872-f996553bae34';
    const SMTP_PASSWORD = 'deba9232-4e71-4720-b872-f996553bae34';

    const host = SMTP_HOST;
    const port = SMTP_PORT;
    const user = SMTP_USERNAME;
    const pass = SMTP_PASSWORD;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
      debug: true,
      headers: {
        'X-PM-Message-Stream': 'outbound',
      },
      priority: 'high',
    });
  }

  async verificatoinEmail(
    email: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    try {
      console.log('mail dsd');
      const templatePath = path.join(
        process.cwd(),
        'src',
        'views',
        `email.ejs`,
      );

      const templateContent = await fsPromises.readFile(templatePath, 'utf8');

      const heading = `Hello ${name ? name : 'user'}, Thanks for creating an account with us`;
      const content = `Click the button below to verify your email`;
      const button = `Verify Email`;
      const renderedHtml = ejs.render(templateContent, {
        url,
        content,
        heading,
        button,
      });

      const msg = {
        Subject: 'Email Verification for Zedblock',
        to: email,
        Body: renderedHtml,
      };

      this.sendEmail(msg);

      return true;
    } catch (error) {
      console.log('error', error.message);
      return false;
    }
  }

  async ForgetPassword(
    email: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    try {
      console.log('url: ', url);
      const templatePath = path.join(
        process.cwd(),
        'src',
        'views',
        `email.ejs`,
      );

      const templateContent = await fsPromises.readFile(templatePath, 'utf8');

      const heading = `${name ? name : 'user'} has requested to reset the password for Zedblock Admin`;
      const content = `Click the button below to reset your password`;
      const button = `Reset Password`;
      const renderedHtml = ejs.render(templateContent, {
        url,
        content,
        heading,
        button,
      });

      const msg = {
        Subject: 'Reset Password',
        to: email,
        Body: renderedHtml,
      };

      this.sendEmail(msg);

      return true;
    } catch (error) {
      console.log('error', error.message);
      return false;
    }
  }

  async sendEmail(data: EmailDTO) {
    try {
      console.log(
        'process.env.ADMIN_SUPPORT_EMAIL: ',
        process.env.ADMIN_SUPPORT_EMAIL,
      );
      const res = await this.transporter.sendMail({
        to: data.to,
        subject: data.Subject,
        html: data.Body,
        from: `<${process.env.ADMIN_SUPPORT_EMAIL}>`,
        headers: {
          'X-PM-Message-Stream': 'outbound',
        },
      });

      console.log('res: ', res);
    } catch (err) {
      console.log('ere', err);
    }
  }
}
