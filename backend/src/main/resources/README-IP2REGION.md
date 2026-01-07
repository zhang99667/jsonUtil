# ip2region 数据文件配置说明

## 获取 ip2region.xdb 数据文件

ip2region 是一个离线IP地址定位库，需要下载 `ip2region.xdb` 数据文件才能正常工作。

### 下载方式

1. **GitHub 官方仓库下载**（推荐）
   
   访问 ip2region 官方仓库：
   ```
   https://github.com/lionsoul2014/ip2region/tree/master/data
   ```
   
   下载 `ip2region.xdb` 文件。

2. **直接下载链接**
   ```
   https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ip2region.xdb
   ```

### 配置步骤

1. 下载 `ip2region.xdb` 文件后，将其放置到以下目录：
   ```
   backend/src/main/resources/ip2region.xdb
   ```

2. 重启后端服务，在日志中会看到：
   ```
   ip2region 数据库加载成功
   ```

### 注意事项

- 数据文件大小约 11MB
- 如果数据文件不存在或加载失败，地理位置解析功能将不可用（不影响其他功能）
- 解析失败的IP会显示为"未知"
- 本地IP（127.0.0.1、localhost）和内网IP（10.x.x.x、192.168.x.x、172.16-31.x.x）会显示为"本地/内网"

### 数据更新

ip2region 数据库会定期更新，建议定期从官方仓库获取最新版本以保持IP解析的准确性。