# 微信聊天机器人

使用 wechaty 和 langchain 制作的微信聊天机器人

> 重要提示：存在微信号被封禁的风险，不要使用日常的微信号，请使用微信小号

安装完成后，支持私聊和群聊，群聊需@ 该机器人

发送消息以#开头 即可开启多功能模式

## 多功能模式支持

1、基于stable diffusion画图，需配置自己的sd接口

2、识别Url内容，对Url内容进行交互

3、联网查询实时内容

#### Step 1: 克隆项目

```sh
git clone https://github.com/gufei/wechat-gpt-bot.git
cd wechat-gpt-bot
```

#### Step 2: 安装依赖

你需要通过运行下面的命令来安装依赖项。

```sh
npm install
```

#### Step 3: 配置文件

制作 .env 文件，并进行配置

```sh
cp .env.example .env
```

#### Step 4: 运行


```sh
npm run start
```

#### Step 5: 使用手机微信号扫码登陆


---

<figure class="third">
<img src=resources/image/zsxq.jpg height=300 /><img src=resources/image/weixin.jpg height=300 />
</figure>
