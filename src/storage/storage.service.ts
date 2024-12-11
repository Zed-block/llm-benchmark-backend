import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.PROJECT_ID,
      credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC79C56PNamw+mK\nJiPDvd2iWeiMQVMudMitiWjXZwaka/ieVu2Id03IZi9bzJaq7LJUhAuw3Szsh7lI\n5fLRGJajm85gtCtfFEhvcw0ihI5YzVOHAiuSiJCfea14zj1ooA7eypUxTcErZ7k9\nE7xCGW5PCqHHuvCWooRRV5wWEI/Gx93wgqh8cHkT9nQX4JrsXY3yqjDxMEpHso6g\nTDK2B3bPQdcd0lkqsmt1S9FcbtxzTMj0Lt2XIMWAJH6zVJegeW2Ke1JaDZlQKL2o\n631oEke9Jx7HV+3g6CzGTMyBZfX7aM9UvDS3BNllVIqIlQ4vWuA3RN8kkKQ0DlRt\niDFmkJARAgMBAAECggEAAZTq36EY+0JrRJwLbswqJBcP+0muXQtIgs2FAAk5kRBz\noTqpATNuqHQuhk4O2h7XsEPD9ivMqGvVj/ws6TbvnMOndrDUy7DFJwhzpL3TNZgP\n7FMqVGoWgaa6965lzduzzQAiZdMXitbSruWWZDiYRmf3+nErnAXqOYXEaNBgUwoO\nSWf+75LDloKgP7gHctJhod6R3O8H+Z159FaVhplRKMx5uCqfUpAfXtpFto8tRaai\nc9ClE0thZkaCSxccnxGPNw/bcmw3bpFk6U30iVbl0W9l9xzK6ASspjpmrRbdF2zo\nBk21wxBCK+zZktnlsXzieVC1JLRx3XRjsxJU7jj4gQKBgQD40Ozse2p4VtBnQ0bA\nZm4XT2RqPbM/7irH2Nrm5HKDqxb/v0mn/km7TSMtk2FlMXIMzemFYdfdNdTXXfpu\nUxPzEVrXDuf2LcxOdKd5WrrnmwQyQIAKFK7FjhJhN1R+s9iKgKHSKT5X45un1UcP\nb5GYiISIHH209oRfmZQJxRzmkQKBgQDBYWeadHOFUO0vVpNCF8YTqaD5f0oQCR2u\nXFsbrDYv9i5LeMtdHu9PKpPkC3rqGAQYTRmeSZfreg6PeDWE8NOO7+Hmw6Yz5qGk\n6EzexaDfnb9KF0O5OHHqZKiqXO+LvjLtDRZSc54cTz5JczHkYilcodqiGASXE0Iw\nkcGUGITRgQKBgEomoWT8hsdkP+l2UECIhiimPWu4BZJ43QD/7ITA8iuxMkJ3dHD/\nRGPwYhp0AKOSr8WHHB/m/9jp8QtZ84crdReMRYEv7QsdrPR4qWxuEKNzPDXpqP7Y\nGRnA9FNKlQDJgjAMk605I14386x50BqWilJl5PFXZFMo4FxJPagHuUwxAoGALNI8\nxynylJXbQ7uXShxkhq4sZ2e/bNQQExfI7jMOJDO1Kz0GNcEzym+d859Nj/CdElzc\ncTmxgpy5vzsnfHatMlYbT/dNEH6GPMiy+HdqACp56dxWkBmrHZ7TERmVVBhziUod\nQGMX5IvhbfjLOZoe6B+Do0pZ1gJatxMxgPfl4QECgYEA+GMn1tfyasvxZZ6jlaRA\nBMfkyNKUtW3nVahGjK3XirhLntRhI9b4WrzhD0CERtepgtun/Ev0X9ju+fQt/dF/\nyD0CPWgVzY4uP98o9C7PUfx9PWkjpKiGFtpJRXe5y3M5wToX2Qv72OvtIXT/A9On\nnFUks2O2e8hTJ3K7JQXs78g=\n-----END PRIVATE KEY-----\n',
      },
    });
  }

  async save(
    path: string,
    media: Buffer,
    // metadata: { [key: string]: string }[]
  ) {
    try {
      const file = await this.storage
        .bucket(process.env.CLOUD_BUCKET)
        .file(path);
      const upload = await file.save(media);
      return 'success';
    } catch (err: any) {
      console.log('error while upload file ' + path + ' - ' + err.message);
      return { isError: true, message: 'error while upload file' };
    }
  }

  async getTemporaryUrl(path: string): Promise<string> {
    try {
      const file = this.storage.bucket(process.env.CLOUD_BUCKET).file(path);

      // Generate a signed URL
      const [url] = await file.getSignedUrl({
        action: 'read', // Action: 'read' allows the file to be downloaded or viewed
        expires: Date.now() + 1000 * 60 * 60, // URL expires in 1 hour
      });

      return url;
    } catch (err: any) {
      console.error(`Error generating signed URL for file ${path}: ${err.message}`);
      throw new Error('Unable to generate signed URL');
    }
  }
}
