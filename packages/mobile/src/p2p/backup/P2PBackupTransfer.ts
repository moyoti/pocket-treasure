import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

/**
 * P2PBackupTransfer - 面对面快速备份传输
 * 
 * 使用本地 WiFi 网络进行设备发现和文件传输
 * 无需互联网连接，两台设备在同一 WiFi 网络即可
 */

interface DeviceInfo {
  id: string;
  name: string;
  ip: string;
  port: number;
}

export class P2PBackupTransfer {
  private static readonly TRANSFER_PORT = 8888;
  private server: any = null;
  private discoveredDevices: DeviceInfo[] = [];

  /**
   * 获取本地 IP 地址
   */
  async getLocalIpAddress(): Promise<string | null> {
    try {
      const ip = await Network.getIpAddressAsync();
      return ip;
    } catch (error) {
      console.error('[P2PTransfer] Failed to get IP:', error);
      return null;
    }
  }

  /**
   * 扫描同一网络下的设备
   * 通过广播 UDP 包发现其他运行 Treasure Cat 的设备
   */
  async scanForDevices(): Promise<DeviceInfo[]> {
    try {
      const localIp = await this.getLocalIpAddress();
      if (!localIp) {
        throw new Error('No network connection');
      }

      // 获取局域网网段
      const subnet = localIp.split('.').slice(0, 3).join('.');
      const devices: DeviceInfo[] = [];

      console.log('[P2PTransfer] Scanning subnet:', subnet);

      // 扫描网段内的所有 IP（简化版，实际应该用 UDP 广播）
      // 这里使用简化的方法：尝试连接常见端口
      const scanPromises: Promise<DeviceInfo | null>[] = [];
      
      // 只扫描常见的 20 个 IP（避免太慢）
      for (let i = 1; i <= 20; i++) {
        const ip = `${subnet}.${i}`;
        if (ip === localIp) continue; // 跳过自己

        scanPromises.push(this.tryConnectToDevice(ip));
      }

      const results = await Promise.all(scanPromises);
      
      for (const device of results) {
        if (device) {
          devices.push(device);
        }
      }

      this.discoveredDevices = devices;
      return devices;
    } catch (error) {
      console.error('[P2PTransfer] Scan failed:', error);
      return [];
    }
  }

  /**
   * 尝试连接设备
   */
  private async tryConnectToDevice(ip: string): Promise<DeviceInfo | null> {
    try {
      // 尝试连接我们的传输端口
      const response = await fetch(`http://${ip}:${P2PBackupTransfer.TRANSFER_PORT}/ping`, {
        method: 'GET',
        timeout: 1000,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.deviceId || ip,
          name: data.deviceName || 'Unknown Device',
          ip: ip,
          port: P2PBackupTransfer.TRANSFER_PORT,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 启动服务器，等待其他设备连接
   */
  async startServer(deviceName: string): Promise<void> {
    try {
      const ip = await this.getLocalIpAddress();
      console.log('[P2PTransfer] Starting server on', ip);

      // 注意：React Native 没有内置 HTTP 服务器
      // 实际实现需要使用原生模块或第三方库
      // 这里提供概念验证

      // 在实际实现中，这里会：
      // 1. 启动 HTTP 服务器监听端口
      // 2. 响应 /ping 请求
      // 3. 响应 /receive-backup POST 请求接收文件
      // 4. 响应 /send-backup GET 请求发送文件

      console.log('[P2PTransfer] Server started (conceptual)');
    } catch (error) {
      console.error('[P2PTransfer] Failed to start server:', error);
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stopServer(): Promise<void> {
    if (this.server) {
      // 停止服务器
      this.server = null;
      console.log('[P2PTransfer] Server stopped');
    }
  }

  /**
   * 发送备份文件到指定设备
   */
  async sendBackup(device: DeviceInfo, backupPath: string): Promise<boolean> {
    try {
      // 读取备份文件
      const backupData = await FileSystem.readAsStringAsync(backupPath);

      // 发送到目标设备
      const response = await fetch(`http://${device.ip}:${device.port}/receive-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backup: backupData,
          filename: backupPath.split('/').pop(),
        }),
      });

      if (response.ok) {
        console.log('[P2PTransfer] Backup sent successfully');
        return true;
      } else {
        throw new Error('Failed to send backup');
      }
    } catch (error) {
      console.error('[P2PTransfer] Send failed:', error);
      return false;
    }
  }

  /**
   * 从指定设备接收备份文件
   */
  async receiveBackup(device: DeviceInfo): Promise<string | null> {
    try {
      const response = await fetch(`http://${device.ip}:${device.port}/send-backup`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const backupPath = FileSystem.documentDirectory + 'backups/' + data.filename;
        
        // 保存到本地
        await FileSystem.writeAsStringAsync(backupPath, data.backup);
        
        console.log('[P2PTransfer] Backup received:', backupPath);
        return backupPath;
      } else {
        throw new Error('Failed to receive backup');
      }
    } catch (error) {
      console.error('[P2PTransfer] Receive failed:', error);
      return null;
    }
  }

  /**
   * 检查是否在同一 WiFi 网络
   */
  async isConnectedToWiFi(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected && networkState.type === Network.NetworkStateType.WIFI;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取网络状态信息
   */
  async getNetworkInfo(): Promise<{
    ip: string | null;
    connected: boolean;
    type: string;
  }> {
    try {
      const [ip, networkState] = await Promise.all([
        this.getLocalIpAddress(),
        Network.getNetworkStateAsync(),
      ]);

      return {
        ip,
        connected: networkState.isConnected,
        type: Network.NetworkStateType[networkState.type] || 'Unknown',
      };
    } catch (error) {
      return {
        ip: null,
        connected: false,
        type: 'Error',
      };
    }
  }
}

// 单例导出
export const p2pBackupTransfer = new P2PBackupTransfer();
