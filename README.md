> **注意**：本项目的目的不是写一个功能非常完善的网盘/文件管理系统，主要目的是作为一个简单的入门学习项目。当然了，如果你有基于阿里云 OSS 分享文件的需求，可以使用本项目或者进行二次开发。

Cloud Drive 是一个极简的现代化云存储系统，基于阿里云 OSS，提供文件上传、下载、分享等功能。系统采用前后端分离架构，提供安全可靠的文件存储服务。

## 技术栈

Cloud Drive 采用主流的技术栈：

- **cloud-drive-backend（后端）**：Java 17 + Spring Boot 3.x + Sa-Token + MySQL+ 阿里云 OSS + Redis + MapStruct + JPA
- **cloud-drive-web（前端）**：React + TypeScript + Vite + Material-UI + FilePond

## 功能特性

目前，本项目已经实现的功能如下：

- 用户登录、邮箱注册
- 文件重命名、上传（支持秒传）、删除、分享（目前仅支持单文件分享，暂不考虑支持多文件和文件夹，减少复杂性，尤其是前端的复杂性）、上传进度跟踪
- 使用 AOP + Redisson 优雅实现分布式限流注解
- 基于 Spring Task 与 ShedLock 的分布式调度实践
- 全局异常处理、异常类封装、参数校验

## 本地开发环境搭建

通过 Git 克隆项目到本地：

```bash
git clone https://gitee.com/SnailClimb/cloud-drive.git
```

### 环境要求

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.6+

### 后端启动步骤

1. 创建数据库

   ```sql
   CREATE DATABASE cloud_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. 修改`application.yml`配置 Redis（必备）、MySQL（必备）、邮箱（可选，用户注册时需要）和阿里云 OSS （必备）

3. 启动后端服务

```bash
cd cloud-drive-backend
mvn spring-boot:run
```

**注意**：

1. 首次运行前请确保已正确配置 MySQL 和 Redis。
2. 文件上传大小限制可在配置文件中调整。
3. 请妥善保管阿里云 OSS 的访问密钥，实际项目中不建议直接明文保存在 `application.yml`中。

### 前端启动步骤

1. 安装依赖

   ```bash
   cd cloud-drive-web
   npm install
   ```

2. 本地启动

   ```bash
   npm run dev
   ```

3. 构建生产版本

   ```bash
   npm run build
   ```

## 效果展示

**登录注册**：

![](https://oss.javaguide.cn/xingqiu/pratical-project/cloud-drive/cloud-drive-front-login-register.png)

**文件列表与文件上传**：

![](https://oss.javaguide.cn/xingqiu/pratical-project/cloud-drive/cloud-drive-front-file-list-and-file-upload.png)

**文件分享**：

![](https://oss.javaguide.cn/xingqiu/pratical-project/cloud-drive/cloud-drive-front-file-share.png)

**文件分享列表**：

![](https://oss.javaguide.cn/xingqiu/pratical-project/cloud-drive/cloud-drive-front-file-share-list.png)

**访问分享文件**：

![](https://oss.javaguide.cn/xingqiu/pratical-project/cloud-drive/cloud-drive-front-visit-file-share.png)

## 主要目录结构

```
cloud-drive/
├── cloud-drive-backend/        # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/cloudrive/
│   │   │   │       ├── config/        # 配置类
│   │   │   │       ├── controller/    # 控制器
│   │   │   │       ├── service/       # 服务层
│   │   │   │       ├── repository/    # 数据访问层
│   │   │   │       ├── model/         # 数据模型
│   │   │   │       ├── common/        # 公共组件
│   │   │   │       └── redis/         # Redis 操作类
│   │   │   └── resources/     # 配置文件
│   │   └── test/              # 测试代码
│   └── pom.xml                # Maven 配置
│
└── cloud-drive-web/           # 前端项目
    ├── src/
    │   ├── components/        # React 组件
    │   ├── pages/            # 页面组件
    │   ├── services/         # API 服务
    │   ├── utils/            # 工具函数
    │   └── App.tsx           # 应用入口
    ├── package.json          # 依赖配置
    └── vite.config.ts        # Vite 配置
```

## **许可证**

[MIT License](LICENSE)