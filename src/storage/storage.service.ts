import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import * as StorageKey from '../storage/GCPkey.json';

@Injectable()
export class StorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage({
      projectId: StorageKey?.project_id,
      credentials: {
        client_email: StorageKey?.client_email,
        private_key: StorageKey?.private_key,
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
