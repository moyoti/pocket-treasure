import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, LessThan } from 'typeorm';
import { MarketListing, ListingStatus } from '../entities/market-listing.entity';
import { CreateListingDto, MarketQueryDto, BuyListingDto } from '../dto/market-list.dto';
import { MarketTransactionService } from './market-transaction.service';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Item, ItemRarity } from '../../item/entities/item.entity';
import { User } from '../../user/entities/user.entity';

// Price range by rarity
const PRICE_RANGES: Record<ItemRarity, { min: number; max: number }> = {
  [ItemRarity.COMMON]: { min: 5, max: 100 },
  [ItemRarity.RARE]: { min: 25, max: 500 },
  [ItemRarity.EPIC]: { min: 100, max: 2000 },
  [ItemRarity.LEGENDARY]: { min: 500, max: 10000 },
};

const DEFAULT_EXPIRATION_DAYS = 7;
const MARKET_FEE_RATE = 0.1; // 10% fee

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    @InjectRepository(MarketListing)
    private listingRepository: Repository<MarketListing>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private marketTransactionService: MarketTransactionService,
  ) {}

  async getListings(query: MarketQueryDto): Promise<{ listings: MarketListing[]; total: number }> {
    const { rarity, search, sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 20 } = query;

    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.item', 'item')
      .leftJoinAndSelect('listing.seller', 'seller')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE })
      .andWhere('listing.expiresAt > :now', { now: new Date() });

    if (rarity) {
      queryBuilder.andWhere('listing.itemRarity = :rarity', { rarity });
    }

    if (search) {
      queryBuilder.andWhere('listing.itemName LIKE :search', { search: `%${search}%` });
    }

    // Validate sortBy to prevent SQL injection
    const validSortFields = ['price', 'createdAt', 'totalPrice', 'quantity'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`listing.${safeSortBy}`, safeSortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [listings, total] = await queryBuilder.getManyAndCount();

    // Remove sensitive seller info
    listings.forEach((listing) => {
      if (listing.seller) {
        delete (listing.seller as any).password;
        delete (listing.seller as any).googleId;
        delete (listing.seller as any).appleId;
      }
    });

    return { listings, total };
  }

  async getMyListings(userId: string): Promise<MarketListing[]> {
    const listings = await this.listingRepository.find({
      where: { sellerId: userId },
      relations: ['item', 'buyer'],
      order: { createdAt: 'DESC' },
    });

    // Remove sensitive buyer info
    listings.forEach((listing) => {
      if (listing.buyer) {
        delete (listing.buyer as any).password;
        delete (listing.buyer as any).googleId;
        delete (listing.buyer as any).appleId;
      }
    });

    return listings;
  }

  async createListing(userId: string, dto: CreateListingDto): Promise<MarketListing | null> {
    const { inventoryItemId, quantity, price } = dto;

    // Get inventory item
    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id: inventoryItemId, userId },
      relations: ['item'],
    });

    if (!inventoryItem) {
      throw new NotFoundException('Item not found in your inventory');
    }

    // Get item ID from inventory item
    const itemId = inventoryItem.itemId;

    // Check if item is locked (e.g., in another trade or listing)
    if ((inventoryItem as any).isLocked) {
      throw new BadRequestException('Item is currently locked and cannot be listed');
    }

    // Check quantity
    if (inventoryItem.quantity < quantity) {
      throw new BadRequestException(`Insufficient quantity. Available: ${inventoryItem.quantity}`);
    }

    // Get item details for rarity
    const item = inventoryItem.item;
    const rarity = item.rarity;

    // Validate price range for rarity
    const priceRange = PRICE_RANGES[rarity];
    if (price < priceRange.min || price > priceRange.max) {
      throw new BadRequestException(
        `Price for ${rarity} items must be between ${priceRange.min} and ${priceRange.max} coins`,
      );
    }

    // Check if item is tradeable (if the field exists)
    if ((item as any).canTrade === false) {
      throw new BadRequestException('This item cannot be traded');
    }

    // Calculate totals
    const totalPrice = price * quantity;
    const fee = Math.floor(totalPrice * MARKET_FEE_RATE);
    const sellerReceives = totalPrice - fee;

    // Set expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRATION_DAYS);

    // Use transaction
    const savedListingId = await this.listingRepository.manager.transaction(async (manager) => {
      // Lock or remove from inventory
      if (inventoryItem.quantity === quantity) {
        // Remove entire item from inventory
        await manager.remove(inventoryItem);
      } else {
        // Reduce quantity
        inventoryItem.quantity -= quantity;
        await manager.save(inventoryItem);
      }

      // Create listing
      const listing = manager.create(MarketListing, {
        sellerId: userId,
        inventoryItemId,
        itemId,
        itemName: item.name,
        itemRarity: rarity,
        quantity,
        price,
        totalPrice,
        feeRate: MARKET_FEE_RATE,
        fee,
        sellerReceives,
        status: ListingStatus.ACTIVE,
        expiresAt,
        totalQuantitySold: 0,
      });

      const savedListing = await manager.save(listing);

      this.logger.log(`Market listing ${savedListing.id} created by user ${userId} for ${quantity}x ${item.name} at ${price} coins each`);

      return savedListing.id;
    });

    return this.listingRepository.findOne({
      where: { id: savedListingId },
      relations: ['item', 'seller'],
    });
  }

  async buyListing(userId: string, listingId: string, dto: BuyListingDto): Promise<MarketListing | null> {
    const quantityToBuy = dto.quantity || 1;

    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['item', 'seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check if listing is active
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException(`Listing is ${listing.status}`);
    }

    // Check if expired
    if (new Date() > listing.expiresAt) {
      listing.status = ListingStatus.EXPIRED;
      await this.listingRepository.save(listing);
      throw new BadRequestException('Listing has expired');
    }

    // Cannot buy own listing
    if (listing.sellerId === userId) {
      throw new ForbiddenException('You cannot buy your own listing');
    }

    // Check quantity
    if (quantityToBuy > listing.quantity) {
      throw new BadRequestException(`Only ${listing.quantity} available`);
    }

    // Calculate total cost
    const totalCost = listing.price * quantityToBuy;

    // Get buyer and seller
    const buyer = await this.userRepository.findOne({ where: { id: userId } });
    const seller = await this.userRepository.findOne({ where: { id: listing.sellerId } });

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check buyer balance
    if (buyer.coins < totalCost) {
      throw new BadRequestException(`Insufficient coins. You have ${buyer.coins}, need ${totalCost}`);
    }

    // Calculate seller receives (proportional to quantity bought)
    const feeForPurchase = Math.floor(totalCost * MARKET_FEE_RATE);
    const sellerReceivesForPurchase = totalCost - feeForPurchase;

    // Use transaction
    await this.listingRepository.manager.transaction(async (manager) => {
      // Deduct coins from buyer
      buyer.coins -= totalCost;
      await manager.save(buyer);

      // Add coins to seller (minus fee)
      seller.coins += sellerReceivesForPurchase;
      await manager.save(seller);

      // Add item to buyer's inventory
      let buyerInventoryItem = await manager.findOne(InventoryItem, {
        where: { userId, itemId: listing.itemId },
      });

      if (buyerInventoryItem) {
        buyerInventoryItem.quantity += quantityToBuy;
        await manager.save(buyerInventoryItem);
      } else {
        buyerInventoryItem = manager.create(InventoryItem, {
          userId,
          itemId: listing.itemId,
          quantity: quantityToBuy,
          collectedLatitude: 0,
          collectedLongitude: 0,
        });
        await manager.save(buyerInventoryItem);
      }

      // Update or complete listing
      if (quantityToBuy === listing.quantity) {
        // Full purchase
        listing.status = ListingStatus.SOLD;
        listing.buyerId = userId;
        listing.soldAt = new Date();
      } else {
        // Partial purchase
        listing.quantity -= quantityToBuy;
        listing.totalPrice = listing.price * listing.quantity;
        listing.fee = Math.floor(listing.totalPrice * MARKET_FEE_RATE);
        listing.sellerReceives = listing.totalPrice - listing.fee;
      }

      listing.totalQuantitySold += quantityToBuy;
      await manager.save(listing);

      // Record the transaction
      await this.marketTransactionService.recordTransaction(listing, userId, quantityToBuy, listing.price);

      this.logger.log(
        `User ${userId} bought ${quantityToBuy}x ${listing.itemName} from user ${listing.sellerId} for ${totalCost} coins`,
      );
    });

    return this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['item', 'seller', 'buyer'],
    });
  }

  async cancelListing(userId: string, listingId: string): Promise<MarketListing | null> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['item'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Only seller can cancel
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only cancel your own listings');
    }

    // Check if already completed
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException(`Cannot cancel a listing that is ${listing.status}`);
    }

    // Use transaction
    await this.listingRepository.manager.transaction(async (manager) => {
      // Return items to seller's inventory
      let sellerInventoryItem = await manager.findOne(InventoryItem, {
        where: { userId, itemId: listing.itemId },
      });

      if (sellerInventoryItem) {
        sellerInventoryItem.quantity += listing.quantity;
        await manager.save(sellerInventoryItem);
      } else {
        sellerInventoryItem = manager.create(InventoryItem, {
          userId,
          itemId: listing.itemId,
          quantity: listing.quantity,
          collectedLatitude: 0,
          collectedLongitude: 0,
        });
        await manager.save(sellerInventoryItem);
      }

      // Update listing status
      listing.status = ListingStatus.CANCELLED;
      await manager.save(listing);

      this.logger.log(`Listing ${listingId} cancelled by user ${userId}`);
    });

    return this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['item'],
    });
  }

  // Get price range for an item rarity
  getPriceRange(rarity: ItemRarity): { min: number; max: number } {
    return PRICE_RANGES[rarity];
  }

  // Expire listings (can be called by cron job)
  async expireListings(): Promise<number> {
    const result = await this.listingRepository
      .createQueryBuilder()
      .update(MarketListing)
      .set({ status: ListingStatus.EXPIRED })
      .where('status = :status', { status: ListingStatus.ACTIVE })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();

    const affected = result.affected ?? 0;
    if (affected > 0) {
      this.logger.log(`Expired ${affected} market listings`);
    }

    return affected;
  }

  // Get market statistics
  async getMarketStats(): Promise<{
    totalActive: number;
    totalSold: number;
    totalValue: number;
  }> {
    const [totalActive, totalSold, soldListings] = await Promise.all([
      this.listingRepository.count({
        where: { status: ListingStatus.ACTIVE },
      }),
      this.listingRepository.count({
        where: { status: ListingStatus.SOLD },
      }),
      this.listingRepository.find({
        where: { status: ListingStatus.SOLD },
        select: ['totalPrice'],
      }),
    ]);

    const totalValue = soldListings.reduce((sum, listing) => sum + listing.totalPrice, 0);

    return { totalActive, totalSold, totalValue };
  }
}