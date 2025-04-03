import { ObjectId } from 'mongodb';

export interface IMessage {
  sender: string;
  content: string;
  timestamp: string;
}

export interface IChat {
  _id?: ObjectId;
  participants: string[];
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatResponse {
  chatId: string;
  participants: string[];
  messages: IMessage[];
} 