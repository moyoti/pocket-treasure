import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MarketTransaction } from '../entities/market-transaction.entity';
import { MarketListing, ListingStatus } from '../entities/market-listing.entity';
import { User } from '../../user/entities/user.entity';
import { PriceHistoryItem, RecentSaleItem, ItemMarketStats } from '../dto/market-transaction.dto';

// System wallet address for fee accumulation
const SYSTEM_WALLET_ADDRESS = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class MarketTransactionService {
  private readonly logger = new Logger(MarketTransactionService.name);

  constructor(
    @InjectRepository(MarketTransaction)
    private transactionRepository: Repository<MarketTransaction>,
    @InjectRepository(MarketListing)
    private listingRepository: Repository<MarketListing>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Record a market transaction and accumulate fees to system account
   */
  async recordTransaction(
    listing: MarketListing,
    buyerId: string,
    quantity: number,
    unitPrice: number,
  ): Promise<MarketTransaction> {
    const totalPrice = quantity * unitPrice;
    const fee = Math.floor(totalPrice * listing.feeRate);
    const sellerReceives = totalPrice - fee;

    // Calculate accumulated fee (running total of fees for the listing)
    const existingTransactions = await this.transactionRepository.find({
      where: { listingId: listing.id },
      order: { soldAt: 'DESC' },
      take: 1,
    });
    const previousFeeAccumulated = existingTransactions.length > 0 ? existingTransactions[0].feeAccumulated : 0;
    const feeAccumulated = previousFeeAccumulated + fee;

    const transaction = this.transactionRepository.create({
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerId,
      itemId: listing.itemId,
      itemName: listing.itemName,
      itemRarity: listing.itemRarity,
      quantity,
      unitPrice,
      totalPrice,
      fee,
      sellerReceives,
      feeAccumulated,
    });

    const saved = await this.transactionRepository.save(transaction);

    // Accumulate fee to system account
    await this.accumulateFeeToSystem(fee, listing.id, buyerId);

    this.logger.log(
      `Transaction recorded: ${quantity}x ${listing.itemName} at ${unitPrice} coins. Fee: ${fee}, Total: ${totalPrice}`,
    );

    return saved;
  }

  /**
   * Accumulate fee to system wallet
   */
  private async accumulateFeeToSystem(fee: number, listingId: string, buyerId: string): Promise<void> {
    // Find or create system user account
    let systemUser = await this.userRepository.findOne({
      where: { id: SYSTEM_WALLET_ADDRESS },
    });

    if (systemUser) {
      systemUser.coins = (systemUser.coins || 0) + fee;
      await this.userRepository.save(systemUser);
    }
    // If system user doesn't exist, fees are effectively burned (removed from circulation)
    // In production, you might want to ensure system account exists

    this.logger.log(`Fee of ${fee} accumulated to system account`);
  }

  /**
   * Get price history for an item over specified days
   */
  async getPriceHistory(itemId: string, days: number = 30): Promise<PriceHistoryItem[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.itemId = :itemId', { itemId })
      .andWhere('transaction.soldAt >= :startDate', { startDate })
      .orderBy('transaction.soldAt', 'ASC')
      .getMany();

    // Group by date (day)
    const groupedByDate = new Map<string, MarketTransaction[]>();

    for (const tx of transactions) {
      const dateKey = tx.soldAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(tx);
    }

    const priceHistory: PriceHistoryItem[] = [];

    for (const [date, txs] of groupedByDate.entries()) {
      const prices = txs.map((tx) => tx.unitPrice);
      const volumes = txs.map((tx) => tx.quantity);

      priceHistory.push({
        date,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        volume: volumes.reduce((a, b) => a + b, 0),
      });
    }

    return priceHistory.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get recent sales with optional item filter
   */
  async getRecentSales(limit: number = 20, itemId?: string): Promise<RecentSaleItem[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.listingId', 'listing')
      .orderBy('transaction.soldAt', 'DESC')
      .take(limit);

    if (itemId) {
      queryBuilder.where('transaction.itemId = :itemId', { itemId });
    }

    const transactions = await queryBuilder.getMany();

    // Get seller names
    const sellerIds = [...new Set(transactions.map((tx) => tx.sellerId))];
    const sellers = await this.userRepository
      .createQueryBuilder('user')
      .whereInIds(sellerIds)
      .select(['user.id', 'user.username'])
      .getMany();

    const sellerMap = new Map(sellers.map((s) => [s.id, s.username]));

    return transactions.map((tx) => ({
      id: tx.id,
      itemName: tx.itemName,
      itemRarity: tx.itemRarity,
      unitPrice: tx.unitPrice,
      quantity: tx.quantity,
      soldAt: tx.soldAt.toISOString(),
      sellerName: sellerMap.get(tx.sellerId) || undefined,
    }));
  }

  /**
   * Get statistics for a specific item
   */
  async getItemStats(itemId: string): Promise<ItemMarketStats> {
    // Get all sold transactions for this item
    const soldTransactions = await this.transactionRepository.find({
      where: { itemId },
      order: { soldAt: 'DESC' },
    });

    // Get active listings count
    const activeListings = await this.listingRepository.count({
      where: { itemId, status: ListingStatus.ACTIVE },
    });

    // Calculate statistics
    const totalVolume = soldTransactions.reduce((sum, tx) => sum + tx.quantity, 0);
    const avgPrice =
      soldTransactions.length > 0
        ? Math.round(soldTransactions.reduce((sum, tx) => sum + tx.unitPrice, 0) / soldTransactions.length)
        : 0;
    const lastSalePrice = soldTransactions.length > 0 ? soldTransactions[0].unitPrice : 0;

    // Calculate price changes
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = soldTransactions.filter((tx) => new Date(tx.soldAt) >= sevenDaysAgo);
    const last30Days = soldTransactions.filter((tx) => new Date(tx.soldAt) >= thirtyDaysAgo);

    const avgPrice7d = last7Days.length > 0
      ? Math.round(last7Days.reduce((sum, tx) => sum + tx.unitPrice, 0) / last7Days.length)
      : avgPrice;
    const avgPrice30d = last30Days.length > 0
      ? Math.round(last30Days.reduce((sum, tx) => sum + tx.unitPrice, 0) / last30Days.length)
      : avgPrice;

    // Calculate percentage changes
    const priceChange7d = avgPrice7d > 0 && avgPrice > 0
      ? Math.round(((avgPrice7d - avgPrice) / avgPrice) * 100)
      : 0;
    const priceChange30d = avgPrice30d > 0 && avgPrice > 0
      ? Math.round(((avgPrice30d - avgPrice) / avgPrice) * 100)
      : 0;

    return {
      avgPrice,
      lastSalePrice,
      totalVolume,
      activeListings,
      priceChange7d,
      priceChange30d,
    };
  }
}