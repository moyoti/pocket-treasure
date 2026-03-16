import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../user/entities/user.entity';
import { SendFriendRequestDto, SearchUserDto } from './dto/send-friend-request.dto';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(
    requesterId: string,
    dto: SendFriendRequestDto,
  ): Promise<Friendship> {
    const { addresseeId, message } = dto;

    // Cannot send friend request to self
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if addressee exists
    const addressee = await this.userRepository.findOne({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Already friends with this user');
      }
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new ConflictException('Friend request already pending');
      }
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('Cannot send friend request to this user');
      }
    }

    // Create new friendship request
    const friendship = this.friendshipRepository.create({
      requesterId,
      addresseeId,
      message,
      status: FriendshipStatus.PENDING,
    });

    return this.friendshipRepository.save(friendship);
  }

  async acceptFriendRequest(
    userId: string,
    friendshipId: string,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the addressee can accept the request
    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('Not authorized to accept this request');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendshipRepository.save(friendship);
  }

  async rejectFriendRequest(
    userId: string,
    friendshipId: string,
  ): Promise<void> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the addressee can reject the request
    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('Not authorized to reject this request');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    friendship.status = FriendshipStatus.REJECTED;
    await this.friendshipRepository.save(friendship);
  }

  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Either user can remove the friendship
    if (
      friendship.requesterId !== userId &&
      friendship.addresseeId !== userId
    ) {
      throw new BadRequestException('Not authorized to remove this friendship');
    }

    await this.friendshipRepository.remove(friendship);
  }

  async getFriends(userId: string): Promise<{ user: User; friendship: Friendship }[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      order: { createdAt: 'DESC' },
    });

    if (friendships.length === 0) {
      return [];
    }

    // Get all friend user IDs
    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );

    const friends = await this.userRepository.find({
      where: { id: In(friendIds) },
    });

    // Map friends with their friendship info
    return friendships.map((friendship) => {
      const friendId =
        friendship.requesterId === userId
          ? friendship.addresseeId
          : friendship.requesterId;
      const friend = friends.find((f) => f.id === friendId);
      return { user: friend!, friendship };
    });
  }

  async getPendingRequests(userId: string): Promise<Friendship[]> {
    // Get requests where the user is the addressee and status is pending
    return this.friendshipRepository.find({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSentRequests(userId: string): Promise<Friendship[]> {
    // Get requests where the user is the requester and status is pending
    return this.friendshipRepository.find({
      where: {
        requesterId: userId,
        status: FriendshipStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getOnlineFriends(userId: string): Promise<{ user: User; friendship: Friendship }[]> {
    const friends = await this.getFriends(userId);
    return friends.filter((f) => f.user.isOnline);
  }

  async searchUsers(userId: string, dto: SearchUserDto): Promise<User[]> {
    const { query } = dto;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Search by email or username (case-insensitive)
    return this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.email LIKE :query OR user.username LIKE :query)',
        { query: `%${query.trim()}%` },
      )
      .andWhere('user.id != :userId', { userId })
      .limit(20)
      .getMany();
  }

  async getFriendshipStatus(
    userId: string,
    otherUserId: string,
  ): Promise<Friendship | null> {
    return this.friendshipRepository.findOne({
      where: [
        { requesterId: userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: userId },
      ],
    });
  }
}