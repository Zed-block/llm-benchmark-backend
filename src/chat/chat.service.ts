import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { TopicService } from 'src/topic/topic.service';
import { askQuestion, askQuestionRes } from './dto/addNewMessage';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly aiService: AiServiceService,
    private readonly topicService: TopicService,
  ) {}

  // Create a new chat message
  async createChat(chatData: Partial<Message>): Promise<Message> {
    const newChat = new this.messageModel(chatData);
    return newChat.save();
  }

  async ask(
    messageData: askQuestion,
    user: CuurentUser,
  ): Promise<askQuestionRes> {
    try {
      if (!messageData?.topicId) {
        let topic = await this.topicService.createTopic({
          type: messageData?.type,
          userId: user?._id,
        });
        messageData.topicId = String(topic._id);
      }
      // Step 1: Save the message to the database
      await this.createChat({
        ...messageData,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });

      // Step 2: Call the AI service for a delayed response
      const aiResponse = await this.aiService.getResponse(messageData, user);

      return aiResponse;
    } catch (err) {
      throw new BadGatewayException(err.message);
    }
  }

  async getSingleMsg(topicId: string, page: number, lastMessageId?: string) {
    try {
      let topic = new mongoose.Types.ObjectId(topicId);
      let limit = 30;
      let lastMessageIndex = 0;

      const messages = await this.messageModel.aggregate([
        {
          $match: {
            topicId: topic,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      if (lastMessageId) {
        let index = messages.findIndex(
          (message) => String(message.messageId) === String(lastMessageId),
        );
        lastMessageIndex = index > 0 ? index + 1 : 0;
      }

      const paginatedMessages = messages.slice(
        lastMessageIndex,
        lastMessageIndex + limit,
      );

      const next = lastMessageIndex + limit < messages.length;

      return {
        messages: paginatedMessages.reverse(),
        next,
        page,
      };
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }

  async getCompare(topicId: string, lastMessageId?: string, model?: string) {
    try {
      let topic = new mongoose.Types.ObjectId(topicId);
      let limit = 20;

      // Initialize the aggregation pipeline
      const pipeline: any[] = [
        {
          $match: {
            topicId: topic,
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort messages by createdAt in descending order
        },
      ];

      // Add the optional match for model if provided
      if (model) {
        pipeline.push({
          $match: {
            selectedModel: model, // Match the model if it's provided
          },
        });
      }

      if (!model) {
        // Add the groupBy to selectedModel to group messages
        pipeline.push({
          $group: {
            _id: '$selectedModel', // Group by selectedModel
            messages: {
              $push: {
                messageId: '$messageId',
                content: '$content',
                role: '$role',
                model: '$model',
                provider: '$provider',
                createdAt: '$createdAt',
                contentType: '$contentType',
                // Add other necessary fields here
              },
            },
            lastIndex: { $last: '$createdAt' }, // Capture the last index based on createdAt
          },
        });
      }

      // Add limit to get only the specified number of messages
      pipeline.push({ $limit: limit + 1 }); // Fetch one extra to check for next page

      // Execute the aggregation
      const results = await this.messageModel.aggregate(pipeline).exec();

      // Check if there are any results for the selected model
      if (model && results.length > 0) {
        const lastMessageIndex = results.findIndex(
          (msg) => msg.messageId === lastMessageId,
        );
        const nextPageAvailable = results.length > limit;

        // Return the messages and last index for the selected model
        return {
          messages: results.slice(
            lastMessageIndex + 1,
            lastMessageIndex + 1 + limit,
          ),
          nextPageAvailable,
        };
      }

      // If no model is specified or model doesn't exist, return grouped messages
      const nextPageAvailable = results.length > limit;

      return {
        messages: results.slice(0, limit),
        nextPageAvailable,
      };
    } catch (err) {
      console.log('ERR', err.message);
      throw new Error('Error while fetching messages');
    }
  }
  async getMessage(
    type: string,
    page: number,
    topicId: string,
    lastMessageId?: string,
  ) {
    try {
      if (type === 'chat' || type === 'llmrouter') {
        return await this.getSingleMsg(topicId, page, lastMessageId);
      }
      if (type === 'compare') {
        return await this.getCompare(topicId, lastMessageId);
      }
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }

  // Delete a chat message by ID
  async deleteChatById(chatId: string): Promise<{ deleted: boolean }> {
    const result = await this.messageModel.deleteOne({ _id: chatId });
    return { deleted: result.deletedCount > 0 };
  }
}
