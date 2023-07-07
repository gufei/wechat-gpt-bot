import {
    Message,
    log,
} from 'wechaty'

import RedisClient from "../common/redis";
import * as wechatyPuppet from "wechaty-puppet";
import {delHtmlTag} from "../utils/helpers";
import {ChatAgent} from "./ChatAgent";
// @ts-ignore
import {AgentExecutor} from "langchain/agents";
// import * as ChatOpenAI from "../models/ChatOpenAI";
import * as ChatOpenAI from '../models/ChatOpenAI'
import {auth} from "../common/auth";


class Wechat {

    StartTime: Date;
    freeTimes = 10;
    botName: string;
    agentMap = new Map<string, AgentExecutor>();

    constructor(botName: string) {
        this.StartTime = new Date()
        log.info("StarterBot", this.StartTime.toLocaleString())
        this.botName = botName
    }

    /**
     * 消息验证，判断是否需要继续处理
     * @param msg
     * @private
     */
    private async validation(msg: Message): Promise<boolean> {

        const fromContact = msg.talker()
        const room = msg.room()

        if (fromContact.name().includes("微信团队")) {
            log.warn("消息来源名称包含 '微信团队'", fromContact.name())
            return false
        }

        if (msg.type() != wechatyPuppet.types.Message.Text) {
            log.warn("消息不是文本类型。消息类型：", msg.type())
            return false
        }

        if (fromContact.type() != wechatyPuppet.types.Contact.Individual) {
            log.warn("消息来源不是个人。消息来源：", fromContact.type())
            return false
        }



        // 免费额度，优先记录，免费额度包括群里的
        let freeTimes = await RedisClient.HINCRBY(this.botName + "-" + "FreeTimeHash", fromContact.name(), 1)

        if (freeTimes > this.freeTimes || room) {

            if(await auth(msg)){
                return true
            }

            if(room){
                return false
            }

            log.warn("免费额度已用完。", fromContact.name(), freeTimes, this.freeTimes)

            // 每天只提醒一次，之后不再应答
            let freeRemind = await RedisClient.SET(this.botName + "-" + "freeRemind-" + fromContact.name(), "1", {
                EX: 86400,
                NX: true
            })

            if (freeRemind) {
                await this.MsgSay("您的免费额度已用完",msg)
            }
            return false
        }

        return true

    }

    /**
     * 清理消息中的杂乱格式，获得 prompt 文本
     * @param msg
     * @private
     */
    private async getPrompt(msg: Message) {

        let prompt = delHtmlTag(msg.text())
        const contactList = await msg.mentionList()
        for (const contact of contactList) {
            prompt = prompt.replace("@" + contact.name(), "")
        }
        prompt = prompt.trim()

        return prompt
    }


    async generate(msg: Message) {

        if (msg.date() < this.StartTime) {
            log.info("Message Time Old", msg.date().toLocaleString())
            return
        }

        log.info('Message', msg.toString())

        if (msg.self()) {
            return
        }

        // const fromContact = msg.talker()
        const room = msg.room()

        if(room && ! await msg.mentionSelf()){
            return
        }

        let validation = await this.validation(msg)
        if (!validation) {
            return
        }

        let prompt = await this.getPrompt(msg)

        if (prompt.startsWith("#")) {
            prompt = prompt.substring(1)
            await this.AgentCall(prompt, msg)
        } else {
            await this.ChatCall(prompt, msg)
        }

    }

    async MsgSay(text: string, msg: Message) {
        const fromContact = msg.talker()
        const room = msg.room()
        if (room) {
            if(fromContact.name()){
                await msg.say("@" + fromContact.name() + " " + text)
            }else{
                await msg.say(text)
            }

        } else {
            await msg.say(text)
        }
    }

    async AgentCall(prompt: string, msg: Message) {

        const fromContact = msg.talker()
        const room = msg.room()

        let key = fromContact.name()

        if (room) {
            key = room.id + " # " + key
        }


        try {

            let chatAgent = await new ChatAgent(msg, key).CreateChatAgent()

            let result = await chatAgent.call({
                input: prompt,
            });

            await this.MsgSay(result.output, msg)
        } catch (e: any) {
            await this.ChatCall(prompt,msg)
        }
    }

    async ChatCall(prompt: string, msg: Message) {
        const fromContact = msg.talker()
        const room = msg.room()

        let key = fromContact.name()

        if (room) {
            key = room.id
        }

        try {
            let gpt4 = false
            if (fromContact.name().includes("BOT佳恒")) {
                gpt4 = true
            }



            if (room) {
                let topic = await room.topic()
                if(topic.includes("百事通ChatGPT") || topic.includes("决战 WEB4")){
                    gpt4 = true
                }
            }


            // 这里注释的是直接使用聊天工具，可以根据群和个人分别进行上下文记忆
            let text = await ChatOpenAI.run(prompt, key,gpt4)

            await this.MsgSay(text, msg)
        } catch (e: any) {
            await this.MsgSay("暂时无法提供服务，请稍候再试。以下是错误信息\n" + e.message.substring(0, 200), msg)
        }

    }
}

export default Wechat;
