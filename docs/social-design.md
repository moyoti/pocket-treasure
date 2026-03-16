# 社交功能系统架构设计

## 概述

本文档概述了寻宝记应用的社交功能系统架构设计，包括好友系统、聊天系统和交易系统。

---

## 1. 数据库实体设计

### 1.1 Friendship Entity

**文件: `packages/backend/src/friend/entities/friendship.entity.ts`**

```typescript
export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requesterId: string;

  @Column()
  addresseeId: string;

  @Column({ type: 'text', default: FriendshipStatus.PENDING })
  status: FriendshipStatus;

  @Column({ nullable: true })
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 1.2 Message Entity

**文件: `packages/backend/src/chat/entities/message.entity.ts`**

```typescript
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column()
  receiverId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 1.3 Conversation Entity

**文件: `packages/backend/src/chat/entities/conversation.entity.ts`**

```typescript
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user1Id: string;

  @Column()
  user2Id: string;

  @Column({ nullable: true })
  lastMessageId: string;

  @Column({ default: 0 })
  unreadCountUser1: number;

  @Column({ default: 0 })
  unreadCountUser2: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 1.4 Trade Entity

**文件: `packages/backend/src/trade/entities/trade.entity.ts`**

```typescript
export enum TradeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  initiatorId: string;

  @Column()
  receiverId: string;

  @Column({ type: 'text', default: TradeStatus.PENDING })
  status: TradeStatus;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @OneToMany(() => TradeItem, (tradeItem) => tradeItem.trade, { cascade: true })
  initiatorItems: TradeItem[];

  @OneToMany(() => TradeItem, (tradeItem) => tradeItem.trade, { cascade: true })
  receiverItems: TradeItem[];
}
```

### 1.5 User Entity Extension

添加到现有 User 实体：

```typescript
@Column({ default: false })
isOnline: boolean;

@Column({ nullable: true })
lastSeenAt: Date;

@Column({ nullable: true })
socketId: string;
```

---

## 2. API接口设计

### 2.1 好友系统 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/friends/request` | 发送好友申请 |
| POST | `/api/friends/accept/:id` | 接受好友申请 |
| POST | `/api/friends/reject/:id` | 拒绝好友申请 |
| DELETE | `/api/friends/:id` | 删除好友 |
| GET | `/api/friends` | 获取好友列表 |
| GET | `/api/friends/requests` | 获取待处理申请 |
| GET | `/api/friends/online` | 获取在线好友 |
| GET | `/api/friends/search` | 搜索用户 |

### 2.2 聊天系统 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/chat/conversations` | 获取所有会话 |
| GET | `/api/chat/conversations/:userId` | 获取与某用户的消息 |
| POST | `/api/chat/send` | 发送消息 |
| POST | `/api/chat/read/:conversationId` | 标记已读 |
| GET | `/api/chat/unread` | 获取未读消息数 |

### 2.3 交易系统 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/trades` | 创建交易请求 |
| GET | `/api/trades` | 获取用户交易列表 |
| GET | `/api/trades/:id` | 获取交易详情 |
| POST | `/api/trades/:id/accept` | 接受交易 |
| POST | `/api/trades/:id/reject` | 拒绝交易 |
| POST | `/api/trades/:id/cancel` | 取消交易 |
| PUT | `/api/trades/:id/items` | 更新交易物品 |
| GET | `/api/trades/history` | 获取交易历史 |

---

## 3. WebSocket事件设计

### 3.1 好友系统事件

**客户端 -> 服务端:**
- `friend:request` - 发送好友申请
- `friend:accept` - 接受好友申请
- `friend:reject` - 拒绝好友申请

**服务端 -> 客户端:**
- `friend:request:received` - 收到好友申请
- `friend:request:accepted` - 好友申请被接受
- `friend:online` - 好友上线
- `friend:offline` - 好友下线

### 3.2 聊天系统事件

**客户端 -> 服务端:**
- `chat:send` - 发送消息
- `chat:typing` - 正在输入
- `chat:read` - 标记已读

**服务端 -> 客户端:**
- `chat:message` - 收到新消息
- `chat:typing` - 对方正在输入
- `chat:read` - 消息已读回执
- `chat:delivered` - 消息已送达

### 3.3 交易系统事件

**客户端 -> 服务端:**
- `trade:create` - 创建交易
- `trade:accept` - 接受交易
- `trade:reject` - 拒绝交易
- `trade:update` - 更新交易物品

**服务端 -> 客户端:**
- `trade:request` - 收到交易请求
- `trade:accepted` - 交易被接受
- `trade:rejected` - 交易被拒绝
- `trade:completed` - 交易完成
- `trade:expired` - 交易过期

---

## 4. 关键业务逻辑

### 4.1 好友申请流程

1. 用户A发送申请 -> 验证关系 -> 创建Friendship(PENDING)
2. 用户B在线 -> WebSocket推送；离线 -> 保存数据库
3. 用户B接受 -> 更新状态(ACCEPTED) -> 通知双方

### 4.2 实时聊天流程

1. 用户A发送消息 -> 验证 -> 创建Message -> 更新Conversation
2. 用户B在线 -> WebSocket推送；离线 -> 保存待推送
3. 已读回执 -> 更新Message.isRead -> 通知发送方

### 4.3 交易流程

1. 发起交易 -> 验证好友关系和物品所有权 -> 创建Trade
2. 接受交易 -> 事务处理：
   - 验证物品存在
   - 转移双方库存
   - 更新交易状态
3. 交易过期 -> 定时任务检查 -> 更新状态(EXPIRED)

---

## 5. 模块结构

```
packages/backend/src/
├── friend/
│   ├── entities/friendship.entity.ts
│   ├── friend.module.ts
│   ├── friend.service.ts
│   └── friend.controller.ts
│
├── chat/
│   ├── entities/message.entity.ts, conversation.entity.ts
│   ├── chat.module.ts
│   ├── chat.service.ts
│   └── chat.controller.ts
│
├── trade/
│   ├── entities/trade.entity.ts, trade-item.entity.ts
│   ├── trade.module.ts
│   ├── trade.service.ts
│   └── trade.controller.ts
│
└── gateway/
    ├── social.gateway.ts
    ├── friend.gateway.ts
    ├── chat.gateway.ts
    └── trade.gateway.ts
```

---

## 6. 实施阶段

1. **阶段一**: 好友系统（实体、服务、控制器、WebSocket）
2. **阶段二**: 聊天系统（实体、服务、控制器、WebSocket）
3. **阶段三**: 交易系统（实体、服务、控制器、WebSocket）