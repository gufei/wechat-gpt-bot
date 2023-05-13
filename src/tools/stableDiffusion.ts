import axios from "axios";
import {DynamicTool} from "langchain/tools";

export const StableDiffusionTool = new DynamicTool({
    name: "Draw",
    description: "当需要画图的时候调用这个获取图片,输入是一段图片的描述,并且这个描述是英文，生成多张图片,返回一个数组，值是每张图片的base64编码",
    func: async (input: string) => {
        let image = await StableDiffusionTxt2img(input)
        return image
    },
    verbose:false,
    returnDirect: true
})

export async function StableDiffusionTxt2img(prompt: string, negativePrompt: string = "") {

    let data = JSON.stringify({
        "n_iter": 4,
        "prompt": prompt,
        "negative_prompt": negativePrompt,
        "restore_faces": true,

    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://172.23.34.126:7860/sdapi/v1/txt2img',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    let response = await axios.request(config)

    return response.data.images

}
