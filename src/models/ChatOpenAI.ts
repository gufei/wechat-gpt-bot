import {ChatOpenAI} from "langchain/chat_models/openai";
import {ConversationChain} from "langchain/chains";
import {BufferWindowMemory} from "langchain/memory";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
} from "langchain/prompts";

import type {ModelSettings} from "../utils/types";
import {GPT_35_TURBO} from "../utils/constants";

export const createChatOpenAIModel = (settings: ModelSettings = {}): ChatOpenAI => {
    if (!settings.customModelName){
        settings.customModelName = GPT_35_TURBO;
    }
    if (!settings.customModelName){
        settings.customTemperature = 0.75;
    }

    return new ChatOpenAI({
        modelName: settings.customModelName || GPT_35_TURBO,
        temperature: settings.customTemperature || 0.75
    }, {
        basePath: process.env.OPENAI_API_BASE,

    });
};
// 用于存储不同的聊天记录的
let memoryMap = new Map<string, BufferWindowMemory>();

export const run = async (prompt: string, memoryKey: string = "history") => {
    try {

        let chatPrompt = ChatPromptTemplate.fromPromptMessages([
            new MessagesPlaceholder(memoryKey),
            HumanMessagePromptTemplate.fromTemplate("{input}")
        ]);

        let memory: BufferWindowMemory | undefined

        if (memoryMap.has(memoryKey)) {
            memory = memoryMap.get(memoryKey)
        } else {
            memory = new BufferWindowMemory(({returnMessages: true, memoryKey: memoryKey}))
        }

        // 如果是默认key，则清除历史记录，防止串台
        if (memoryKey == "history" && memory instanceof BufferWindowMemory) {
            await memory.clear()
        }

        let modelSettings: ModelSettings = {
            customTemperature: 0.75
        }

        const chain = new ConversationChain({
            memory: memory,
            llm: createChatOpenAIModel(modelSettings),
            prompt: chatPrompt,
            verbose: process.env.VERBOSE ? true : false
        });

        const response = await chain.call({input: prompt})

        if (memory instanceof BufferWindowMemory) {
            memoryMap.set(memoryKey, memory)
        }
        // console.log(response)
        return response.response
    } catch (e: any) {
        if (memoryMap.has(memoryKey)) {
            const memory = memoryMap.get(memoryKey)
            if(memory instanceof BufferWindowMemory) {
                await memory.clear()
            }else{
                memoryMap.delete(memoryKey)
            }
        }
        return "暂时无法提供服务，请稍候再试。以下是错误信息\n" + e.message.substring(0, 200)
    }
}
