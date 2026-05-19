const fs = require('fs');
const { createCanvas } = require('canvas');

// 创建 2732x2732 画布
const canvas = createCanvas(2732, 2732);
const ctx = canvas.getContext('2d');

// 填充背景色 #FFF8E7
ctx.fillStyle = '#FFF8E7';
ctx.fillRect(0, 0, 2732, 2732);

// 读取并绘制图标（居中）
const iconPath = './assets/icon.png';
const icon = new Image();
icon.src = fs.readFileSync(iconPath);

// 图标大小设为 1024x1024，居中显示
const iconSize = 1024;
const x = (2732 - iconSize) / 2;
const y = (2732 - iconSize) / 2;

ctx.drawImage(icon, x, y, iconSize, iconSize);

// 保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./assets/splash.png', buffer);

console.log('✅ Splash screen generated: 2732x2732');
