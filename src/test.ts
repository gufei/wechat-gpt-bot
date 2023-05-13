import * as dotenv from 'dotenv';

dotenv.config();
import {Calculator} from "langchain/tools/calculator";
import {initializeAgentExecutorWithOptions} from "langchain/agents";
import {createChatOpenAIModel,run as ChatOpenAIRun} from "./models/ChatOpenAI";
import {DynamicTool} from "langchain/tools";
import {StableDiffusionTxt2img} from "./tools/stableDiffusion";
// import * as ChatOpenAI from "./models/ChatOpenAI";


async function test() {

    const modelSetting = {
        customTemperature: 0
    }

    const model = createChatOpenAIModel(modelSetting);

    // const model = new ChatOpenAI({ temperature: 0,verbose:true });
    // const model = new OpenAI({ temperature: 0 });


    const StableDiffusionTool = new DynamicTool({
        name: "Draw",
        description: "When there is a need to draw pictures, call this function to get images. The input is a description of an image in English, and the function should generate multiple images and return an array containing the base64 encoding of each image.",
        func: async (input: string) => {
            let image = await StableDiffusionTxt2img(input)
            return image
        },
        returnDirect: true
    })

    const ChatGPTTool = new DynamicTool({
        name: "Chat",
        description: "这是一个有用的助手，写作，写诗，写故事，写剧本等写作类工作，推理、判断等工作，以及使用其他工具无法得到满意回答时可以使用这个工具,这个工具的输入是用户的文本.并且使用和用户输入相同的语言进行输出.",
        func: async (input: string) => {
            let text = await ChatOpenAIRun(input)
            return text.toString()
        },
        returnDirect: true
    })


    const tools = [
        new Calculator(true),
        StableDiffusionTool,
        ChatGPTTool
    ];


    const executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: "chat-conversational-react-description",
        verbose: true,
    });

    const result = await executor.call({
        input: "你作为一个语文老师，以“一声惊雷” 写一首关于爱情的诗词",
    });

    console.log(result.output);

}

test().then(() => console.log("end"))

