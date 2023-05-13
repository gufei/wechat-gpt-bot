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
}

app()
    .catch(console.error)
