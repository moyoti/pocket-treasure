# Implementation Tasks - Recharge System

## Phase 1: Backend - Gems Currency & Entities

### 1. User Entity Extension

- [ ] 1.1 Add `gems` field (number, default 0) to User entity
- [ ] 1.2 Add `totalGemsPurchased` field (number, default 0) to User entity
- [ ] 1.3 Create database migration for User table changes

### 2. GemService

- [ ] 2.1 Create `GemService` in `packages/backend/src/economy/services/gem.service.ts`
- [ ] 2.2 Implement `addGems(userId, amount, reason)` method
- [ ] 2.3 Implement `deductGems(userId, amount, reason)` method with balance check
- [ ] 2.4 Implement `getGemsBalance(userId)` method
- [ ] 2.5 Implement `getGemsTransactions(userId)` method
- [ ] 2.6 Register GemService in economy module

### 3. RechargePackage Entity & Seeder

- [ ] 3.1 Create `RechargePackage` entity in `packages/backend/src/economy/entities/`
- [ ] 3.2 Define 6 pricing tiers: ¥6/60, ¥30/320, ¥68/700, ¥128/1380, ¥328/3600, ¥648/8000
- [ ] 3.3 Create seeder for default recharge packages
- [ ] 3.4 Add endpoint to list available packages (GET /recharge-packages)

### 4. RechargeRecord Entity

- [ ] 4.1 Create `RechargeRecord` entity (userId, packageId, amount, status, orderNo, createdAt)
- [ ] 4.2 Implement payment status enum (pending, completed, failed, refunded)
- [ ] 4.3 Create migration for recharge_records table

### 5. RechargeService

- [ ] 5.1 Create `RechargeService` in `packages/backend/src/economy/services/recharge.service.ts`
- [ ] 5.2 Implement `createOrder(userId, packageId)` - creates pending order
- [ ] 5.3 Implement `completeOrder(orderNo, transactionId)` - marks complete, adds gems
- [ ] 5.4 Implement `failOrder(orderNo)` - marks failed
- [ ] 5.5 Implement `getUserRechargeHistory(userId)` method
- [ ] 5.6 Implement payment callback endpoint (POST /recharge/callback) - placeholder for WeChat/Alipay

## Phase 2: Backend - Gems消耗 & Premium Gacha

### 6. GemTransaction Entity

- [ ] 6.1 Create `GemTransaction` entity (userId, amount, type, reason, createdAt)
- [ ] 6.2 Transaction types: PURCHASE, GACHA, SHOP, REFUND, ACHIEVEMENT
- [ ] 6.3 Create migration for gem_transactions table

### 7. GachaService Extension

- [ ] 7.1 Add Gems-only gacha pool to GachaService
- [ ] 7.2 Implement premium gacha rates (Legendary 15%, Epic 25%, Rare 35%, Common 25%)
- [ ] 7.3 Add `rollGachaPool(userId, poolType: 'coins' | 'gems')` method
- [ ] 7.4 Deduct gems on gems pool roll (10 gems per roll)
- [ ] 7.5 Add gems pool selection to roll endpoint

### 8. Economy Module Cleanup

- [ ] 8.1 Export new entities and services
- [ ] 8.2 Update economy module imports
- [ ] 8.3 Update shared/types if needed

## Phase 3: Frontend - Miniprogram

### 9. Recharge Page

- [ ] 9.1 Create `pages/recharge/recharge.ts` page with package list
- [ ] 9.2 Create `pages/recharge/recharge.wxml` with card UI for each package
- [ ] 9.3 Create `pages/recharge/recharge.wxss` with styles
- [ ] 9.4 Create `pages/recharge/recharge.json` with navigation bar config
- [ ] 9.5 Fetch and display 6 recharge packages from API
- [ ] 9.6 Implement purchase button with loading state
- [ ] 9.7 Show success/failure toast after purchase attempt

### 10. Gacha Page Extension - Gems Pool

- [ ] 10.1 Add pool selector (Coins / Gems) to gacha page
- [ ] 10.2 Show gems balance in header
- [ ] 10.3 Display gems pool rates (Legendary 15%, Epic 25%, etc.)
- [ ] 10.4 Disable roll button if insufficient gems
- [ ] 10.5 Deduct gems on gems pool roll

### 11. Balance Display Updates

- [ ] 11.1 Update map page header to show gems balance
- [ ] 11.2 Update inventory page header to show gems balance
- [ ] 11.3 Update shop page header to show gems balance

### 12. Navigation

- [ ] 12.1 Add "充值" (Recharge) button to map page header
- [ ] 12.2 Update tabbar if needed

## Phase 4: Testing & Verification

### 13. Backend Testing

- [ ] 13.1 Test GemService.addGems and deductGems
- [ ] 13.2 Test recharge package listing endpoint
- [ ] 13.3 Test order creation and completion flow
- [ ] 13.4 Test gems gacha pool rates
- [ ] 13.5 Run backend migration and seed

### 14. Frontend Testing

- [ ] 14.1 Test recharge page loads and displays packages
- [ ] 14.2 Test purchase flow (mock success)
- [ ] 14.3 Test gems gacha pool selection and rolling
- [ ] 14.4 Test gems balance display across pages
- [ ] 14.5 Run miniprogram build to verify no errors

### 15. Integration Testing

- [ ] 15.1 Test full purchase flow: frontend → backend → gems credited
- [ ] 15.2 Test gems gacha: deduct gems → receive item → inventory updated
- [ ] 15.3 Verify no breaking changes to existing coins flow
