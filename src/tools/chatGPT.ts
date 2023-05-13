import {DynamicTool} from "langchain/tools";
import {run as ChatOpenAIRun} from "../models/ChatOpenAI";

export const ChatGPTTool = new DynamicTool({
    name: "Search",
    description: "这是一个有用的助手，写作，写诗，写故事，写剧本等写作类工作，推理、判断等工作，回答问题，以及使用其他工具无法得到满意回答时可以使用这个工具,这个工具的输入是用户的文本.并且使用和用户输入相同的语言进行输出.",
    func: async (input: string) => {
        let text = await ChatOpenAIRun(input,"Search-Tool")
        return text.toString()
    },
    returnDirect: true
})
