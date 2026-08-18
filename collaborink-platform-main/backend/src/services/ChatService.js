import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import DirectMessage from '../models/DirectMessage.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export class ChatService {
  static async createChannel(channelData, userId) {
    const channel = new Channel({
      ...channelData,
      creator: userId,
      members: [{ user: userId, role: 'owner' }],
    });

    await channel.save();
    return channel.populate('members.user');
  }

  static async getChannelMessages(channelId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    return await Message.find({ channel: channelId, isDeleted: false })
      .populate('author')
      .populate('mentions')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  static async sendMessage(messageData, userId) {
    const message = new Message({
      ...messageData,
      author: userId,
    });

    await message.save();
    await message.populate('author mentions');

    // Notify mentioned users
    if (message.mentions.length > 0) {
      await Notification.insertMany(
        message.mentions.map(mentionedUser => ({
          recipient: mentionedUser._id,
          sender: userId,
          type: 'message_mention',
          title: 'You were mentioned',
          message: `You were mentioned in #${messageData.channel}`,
          resourceId: message._id,
          resourceType: 'message',
        }))
      );
    }

    // Update channel's last message
    await Channel.findByIdAndUpdate(messageData.channel, {
      $push: { messages: message._id },
    });

    return message;
  }

  static async deleteMessage(messageId, userId) {
    return await Message.findByIdAndUpdate(
      messageId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: '[deleted]',
      },
      { new: true }
    );
  }

  static async editMessage(messageId, newContent, userId) {
    const message = await Message.findById(messageId);

    // Store edit history
    if (!message.edited.editHistory) {
      message.edited.editHistory = [];
    }

    message.edited.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });

    message.content = newContent;
    message.edited.isEdited = true;
    message.edited.editedAt = new Date();

    await message.save();
    return message;
  }

  static async addReaction(messageId, emoji, userId) {
    const message = await Message.findById(messageId);
    const reaction = message.reactions.find(r => r.emoji === emoji);

    if (reaction) {
      if (!reaction.users.includes(userId)) {
        reaction.users.push(userId);
        reaction.count = reaction.users.length;
      }
    } else {
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1,
      });
    }

    await message.save();
    return message;
  }

  static async removeReaction(messageId, emoji, userId) {
    const message = await Message.findById(messageId);
    const reaction = message.reactions.find(r => r.emoji === emoji);

    if (reaction) {
      reaction.users = reaction.users.filter(u => u.toString() !== userId.toString());
      reaction.count = reaction.users.length;

      if (reaction.count === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    }

    await message.save();
    return message;
  }

  static async pinMessage(messageId, channelId, userId) {
    await Message.findByIdAndUpdate(messageId, { isPinned: true });
    return await Channel.findByIdAndUpdate(
      channelId,
      { $addToSet: { pinnedMessages: messageId } },
      { new: true }
    );
  }

  static async createDirectMessage(recipientId, userId) {
    let dm = await DirectMessage.findOne({
      participants: { $all: [userId, recipientId] },
    });

    if (!dm) {
      dm = new DirectMessage({
        participants: [userId, recipientId],
      });
      await dm.save();
    }

    return dm.populate('participants');
  }

  static async sendDirectMessage(dmId, messageData, userId) {
    const message = new Message({
      ...messageData,
      author: userId,
    });

    await message.save();
    await DirectMessage.findByIdAndUpdate(
      dmId,
      {
        $push: { messages: message._id },
        lastMessage: {
          content: message.content,
          author: userId,
          timestamp: new Date(),
        },
      }
    );

    return message.populate('author');
  }

  static async getDirectMessages(dmId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    return await Message.find({ _id: { $in: dmId.messages } })
      .populate('author')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  static async addChannelMember(channelId, userId, addedBy) {
    return await Channel.findByIdAndUpdate(
      channelId,
      {
        $push: {
          members: { user: userId, role: 'member' },
        },
      },
      { new: true }
    ).populate('members.user');
  }

  static async removeChannelMember(channelId, userId) {
    return await Channel.findByIdAndUpdate(
      channelId,
      {
        $pull: {
          members: { user: userId },
        },
      },
      { new: true }
    );
  }
}