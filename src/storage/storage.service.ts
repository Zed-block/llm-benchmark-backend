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
        private_key: process.env.PRIVATE_KEY,
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
}
