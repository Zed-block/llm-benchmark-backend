import mongoose from 'mongoose';

export class CuurentUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
