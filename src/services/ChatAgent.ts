import {createChatOpenAIModel, run as ChatOpenAIRun} from "../models/ChatOpenAI";
import {Calculator} from "langchain/tools/calculator";
import {initializeAgentExecutorWithOptions} from "langchain/agents";
import {AIPluginTool, DadJokeAPI, DynamicTool, RequestsGetTool, RequestsPostTool, Serper} from "langchain/tools";
import axios from "axios";
import type {Message} from "wechaty";
import {FileBox} from "file-box";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import { WebBrowser } from "langchain/tools/webbrowser";

const systemMessage = `助理是一个由OpenAI训练的大型语言模型。

助理被设计为能够协助完成各种任务，从回答简单的问题到提供深入的解释和对各种主题的讨论。作为一个语言模型，助理能够根据它收到的输入生成类似人类的文本，使它能够参与自然的对话，并提供与手头话题相关的连贯的回应。

助理正在不断学习和改进，其能力也在不断发展。它能够处理和理解大量的文本，并能利用这些知识对广泛的问题提供准确和翔实的答复。此外，助理能够根据它收到的输入生成自己的文本，使它能够参与讨论，并就广泛的主题提供解释和说明。

总的来说，助理是一个强大的系统，可以帮助完成广泛的任务，并就广泛的主题提供宝贵的见解和信息。无论你是需要帮助解决某个具体问题，还是只想就某个特定话题进行交流，助理都能提供帮助。`

const humanMessage = `工具
------
助理可以要求用户使用工具来查找可能有助于回答用户原始问题的信息。人类可以使用的工具有：

{{tools}}

{format_instructions}

用户的输入
--------------------
这里是用户的输入（记得要用一个带有单一动作的json blob的markdown代码片段来回应，而不是别的）：

{{{{input}}}}`

export class ChatAgent {

    msg: Message;
    key: string = "history"

    constructor(msg: Message, key: string = "history") {
        this.msg = msg
        this.key = key
    }

    // constructor(key: string = "history") {
    //     // this.msg = msg
    //     this.key = key
    // }

    async StableDiffusionTxt2img(prompt: string, negativePrompt: string = "") {

        let data = JSON.stringify({
            "n_iter": 4,
            "prompt": prompt,
            "negative_prompt": negativePrompt,
            "restore_faces": true,

        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.STABLE_DIFFUSION_BASE ?? 'http://127.0.0.1:7860/sdapi/v1/txt2img',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        let response = await axios.request(config)

        for (let i in response.data.images) {
            let imageBox = FileBox.fromBase64(response.data.images[i], "generate_" + i + ".png")
            await this.msg.say(imageBox)
        }

        return this.msg.text() + "----AI绘图已完成"

    }


    async CreateChatAgent() {

        const modelSetting = {
            customTemperature: 0
        }
        const model = createChatOpenAIModel(modelSetting);

        let StableDiffusionTool = new DynamicTool({
            name: "draw",
            description: "这个工具可以绘制图像、画图、生成照片、生成图片。输入的是图像的英文提示，注意必须是英文提示。",
            func: async (input: string) => {
                let image = await this.StableDiffusionTxt2img(input)
                return image
            },
            returnDirect: true
        })

        // let ChatGPTTool = new DynamicTool({
        //     name: "chat",
        //     description: "这个工具可以完成写作、诗歌、故事、剧本和其他写作任务，推理、判断和其他推理任务，回答普通常识性问题，输入是用户的提供的提示或问题。输出使用与用户的输入相同的语言。",
        //     func: async (input: string) => {
        //         let text = await ChatOpenAIRun(input)
        //         return text.toString()
        //     },
        //     returnDirect: true
        // })

        // let calculator = new Calculator()
        // calculator.description = "有助于获得数学表达式的结果。这个工具的输入应该是一个有效的数学表达式，可以由一个简单的计算器执行。"


        const embeddings = new OpenAIEmbeddings();
        // const browser = new WebBrowser({model, embeddings});


        const tools = [
            StableDiffusionTool,//画图工具
            new Calculator(),//计算器
            new WebBrowser({model, embeddings}),//
            new DadJokeAPI(),
            // new Serper(process.env.SERPER_API_KEY ?? "",{gl:"hk",hl: "zh-cn"}),
            new RequestsGetTool(),
            new RequestsPostTool(),
            await AIPluginTool.fromPluginUrl(
                "https://www.klarna.com/.well-known/ai-plugin.json"
            ),
        ];

        const executor = await initializeAgentExecutorWithOptions(tools, model, {
            agentType: "chat-conversational-react-description",
            agentArgs: {
                systemMessage: systemMessage,
                humanMessage: humanMessage,
            },
            verbose: process.env.VERBOSE ? true : false
        });


        return executor

    }
}
