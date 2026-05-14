# 🌐 快速部署隐私政策到 GitHub Pages

## ⚡ 5 分钟快速部署（推荐方法）

### 第 1 步：创建 GitHub 仓库（2 分钟）

1. 访问 https://github.com
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - **Repository name**: `treasure-cat`
   - **Description**: Privacy Policy for Treasure Cat
   - **Visibility**: ✅ Public（必须公开）
   - **Initialize**: ✅ Add a README file
4. 点击 "Create repository"

### 第 2 步：上传 HTML 文件（2 分钟）

1. 在仓库页面，点击 "Add file" → "Upload files"
2. 将 `privacy-policy.html` 拖放到上传区域
3. 在 "Commit changes" 输入框填写：Upload privacy policy
4. 点击 "Commit changes"

### 第 3 步：启用 GitHub Pages（1 分钟）

1. 进入仓库的 **Settings**（设置）
2. 左侧菜单找到并点击 **Pages**
3. 在 "Build and deployment" 下：
   - **Source**: Deploy from a branch
   - **Branch**: main → 选择 "main" → 文件夹选择 "/ (root)"
4. 点击 **Save**

### 第 4 步：获取你的隐私政策 URL

等待 1-2 分钟后，你的隐私政策将在以下地址可用：

```
https://你的用户名.github.io/treasure-cat/privacy-policy.html
```

**例如：**
```
https://moyoti.github.io/treasure-cat/privacy-policy.html
```

---

## ✅ 验证部署

1. 在浏览器中打开你的隐私政策 URL
2. 检查页面是否正常显示
3. 确认样式美观（应该有渐变背景和卡片布局）
4. 测试移动端显示（用手机打开）

---

## 🔗 在 Google Play Console 中使用

1. 复制你的隐私政策 URL
2. 登录 Google Play Console
3. 进入你的应用页面
4. 找到 "App content" → "Privacy policy"
5. 粘贴 URL
6. 点击 "Save"

---

## 🎨 自定义（可选）

### 修改联系信息

编辑 `privacy-policy.html` 文件，找到这部分：

```html
<div class="contact-box">
    <h3>📧 Get in Touch</h3>
    <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
    <p>
        <strong>Email:</strong> <a href="mailto:support@treasurecat.com">support@treasurecat.com</a><br>
        <strong>Website:</strong> <a href="https://treasurecat.com" target="_blank" rel="noopener">treasurecat.com</a>
    </p>
</div>
```

将邮箱和网站改成你的真实信息：
- `support@treasurecat.com` → 你的支持邮箱
- `treasurecat.com` → 你的网站（可选）

### 修改开发者名称

找到页脚部分：
```html
<p><strong>Developer:</strong> Treasure Cat Team</p>
```

改成你的名字或工作室名称。

---

## 📱 用手机测试

1. 在手机浏览器打开隐私政策 URL
2. 检查是否美观易读
3. 确认所有链接可点击
4. 测试联系邮箱链接（应该打开邮件应用）

---

## 🔄 更新隐私政策

如果需要更新内容：

1. 编辑本地的 `privacy-policy.html`
2. 在 GitHub 仓库页面点击 "Upload files"
3. 上传新版本（会覆盖旧版本）
4. GitHub Pages 会自动更新（约 1-2 分钟）

---

## ⚠️ 常见问题

### Q: 页面显示 404 错误
**A:** 
- 等待 2-3 分钟，GitHub Pages 需要时间构建
- 检查 Branch 是否正确设置为 "main"
- 确认文件名是 `privacy-policy.html`（全小写）

### Q: 样式没有加载
**A:**
- 清除浏览器缓存
- 使用无痕模式打开
- 检查 HTML 文件是否完整上传

### Q: 可以自定义域名吗？
**A:** 可以！在 Pages 设置中添加自定义域名，需要：
- 拥有自己的域名
- 配置 DNS 记录
- 详见：https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

---

## 🎉 完成！

现在你有一个：
- ✅ 专业的隐私政策页面
- ✅ 美观的渐变设计
- ✅ 移动端友好
- ✅ 永久免费的托管
- ✅ 易于更新

**下一步：** 将 URL 提交到 Google Play Console！

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 GitHub Pages 文档：https://docs.github.com/en/pages
2. 查看 GitHub Status：https://www.githubstatus.com
3. 联系 GitHub Support

---

**祝部署顺利！** 🚀
