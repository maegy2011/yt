# Vercel部署指南

## 问题诊断

如果您在Vercel上部署后无法添加频道，请按照以下步骤进行诊断和修复：

## 1. 环境变量配置

在Vercel项目设置中，确保配置了以下环境变量：

### 必需的环境变量

```bash
# 数据库连接字符串
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# YouTube API密钥
YOUTUBE_API_KEY=your_real_youtube_api_key
```

### 数据库选项

**选项1：使用Vercel Postgres（推荐）**
1. 在Vercel项目中创建Postgres数据库
2. 复制提供的连接字符串到`DATABASE_URL`

**选项2：使用外部PostgreSQL数据库**
- 确保数据库支持SSL连接
- 连接字符串格式：`postgresql://user:password@host:port/database?sslmode=require`

**注意：** Vercel不支持SQLite文件数据库，必须使用PostgreSQL

## 2. YouTube API密钥配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用YouTube Data API v3
4. 创建API密钥
5. 将密钥添加到Vercel环境变量

## 3. 部署步骤

### 自动部署
```bash
# 推送到GitHub，Vercel会自动部署
git add .
git commit -m "Fix channel addition and add system status"
git push origin main
```

### 手动部署
1. 在Vercel控制台选择项目
2. 点击"Deploy"
3. 选择分支并点击"Deploy"

## 4. 验证部署

部署完成后，访问以下URL验证功能：

### 系统状态检查
```
https://your-app.vercel.app/api/health
```

应该返回类似以下内容：
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "url": "configured",
    "provider": "postgresql"
  },
  "youtube": {
    "apiKey": "configured",
    "isDemo": false
  }
}
```

### 管理面板
```
https://your-app.vercel.app/admin
```
- 密码：`admin123`
- 检查"حالة النظام"部分是否显示绿色状态

## 5. 常见问题解决

### 问题1：数据库连接错误
**症状：** 系统状态显示数据库未连接
**解决：**
1. 检查`DATABASE_URL`是否正确
2. 确保数据库允许来自Vercel的连接
3. 验证SSL配置

### 问题2：YouTube API错误
**症状：** 系统状态显示YouTube API未配置
**解决：**
1. 检查`YOUTUBE_API_KEY`是否正确
2. 验证API密钥是否有效
3. 确保YouTube Data API v3已启用

### 问题3：无法添加频道
**症状：** 点击添加频道后显示错误
**解决：**
1. 检查系统状态面板
2. 确保数据库和YouTube API都正常
3. 查看浏览器控制台错误信息

### 问题4：频道ID格式错误
**症状：** 提示"معرف القناة يجب أن يبدأ بـ UC..."
**解决：**
1. 确保使用正确的YouTube频道ID
2. 频道ID格式：`UCXbP_pDv9wEeT9tOEGiZU2g`
3. 从YouTube频道页面URL中获取

## 6. 测试频道添加

使用以下测试数据验证功能：

```json
{
  "id": "UCXbP_pDv9wEeT9tOEGiZU2g",
  "name": "قناة تجريبية",
  "description": "قناة تجريبية للاختبار",
  "category": "تجريبي",
  "thumbnailUrl": "https://via.placeholder.com/150"
}
```

## 7. 监控和日志

在Vercel控制台中：
1. 查看"Functions"标签页的日志
2. 检查"Analytics"中的错误
3. 监控API端点的响应时间

## 8. 性能优化

1. 启用Vercel Edge Functions
2. 配置CDN缓存
3. 优化数据库查询
4. 使用Vercel Analytics监控性能

## 联系支持

如果问题仍然存在，请提供以下信息：
- Vercel项目URL
- 系统状态API响应
- 浏览器控制台错误信息
- Vercel Functions日志