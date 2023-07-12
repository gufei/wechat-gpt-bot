import * as dotenv from 'dotenv';

dotenv.config();

import {
    Contact,
    Message,
    ScanStatus,
    WechatyBuilder,
    log,
} from 'wechaty'

// import * as qrcodeTerminal from "qrcode-terminal";

import Wechat from "./services/wechat";

// @ts-ignore
import qrcodeTerminal from "qrcode-terminal"
import RedisClient from "./common/redis";
import {commandOptions} from 'redis';

const botname = process.env.BOTNAME ?? "gpt-bot"

async function app() {

    let wechat = new Wechat(botname)

    const bot = WechatyBuilder.build({
        name: botname,
        puppet: 'wechaty-puppet-wechat',
        puppetOptions: {
            uos: true,
        },
    })

    function onScan(qrcode: string, status: ScanStatus) {
        if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
            const qrcodeImageUrl = [
                'https://wechaty.js.org/qrcode/',
                encodeURIComponent(qrcode),
            ].join('')
            log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

            qrcodeTerminal.generate(qrcode, {small: true})  // show qrcode on console

        } else {
            log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
        }
    }

    function onLogin(user: Contact) {
        log.info('StarterBot', '%s login', user)
    }

    async function onMessage(message: Message) {
        // console.log(`Message: ${message}`)
        await wechat.generate(message)
    }


    bot.on('scan', onScan)
    bot.on('login', onLogin)
    bot.on('message', onMessage)


    await bot.start()

    // 通知功能，利用消息进行中转，可扩展为多模通知
    function quant_notify() {
        RedisClient.blPop(
            commandOptions({isolated: true}),
            'notify_message', 0
        ).then(async (v) => {
            // log.info("notify_message : %s", v?.element)
            if (bot.isLoggedIn) {
                try {
                    if (v !== null) {
                        let obj = JSON.parse(v.element)
                        let roomArr = new Array()
                        if (obj.typename == "news") {
                            roomArr = ['新闻快讯']
                        } else if (obj.typename == "stock") {
                            roomArr = ['百事通ChatGPT']
                        } else {
                            roomArr = ['百事通ChatGPT']
                        }
                        for (const room_name of roomArr) {
                            let notify_room = await bot.Room.find({topic: room_name})
                            if (typeof notify_room !== 'undefined') {
                                await notify_room.say(obj.msg)
                            }
                        }
                    }

                } catch (e: any) {
                    log.info("notify_message_error", e.message)
                }

            }

            await quant_notify()
            return
        });
    }

    quant_notify()


}


app().catch(console.error)
