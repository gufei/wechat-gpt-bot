import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import type { ModelSettings } from "./types";
import { GPT_35_TURBO } from "./constants";


export const CHATAGENT_PREFIX = `请使用和用户输入相同的语言，尽可能地回答下列问题。你可以使用以下工具：`;

export const CHATAGENT_SUFFIX = `开始吧! 提醒您在回复时一定要使用准确的字符串 \`Final Answer\` `;

export const createModel = (settings: ModelSettings) => {
  let _settings: ModelSettings | undefined = settings;
  if (!settings.customModelName) {
    _settings = undefined;
  }

  return new OpenAI({
    openAIApiKey: _settings?.customApiKey || process.env.OPENAI_API_KEY,
    temperature: _settings?.customTemperature || 0.75,
    modelName: _settings?.customModelName || GPT_35_TURBO,
    maxTokens: _settings?.maxTokens || 2000,
  },{basePath: "https://openai.depay.biz/v1"});
};
export const startGoalPrompt = new PromptTemplate({
  template:
    "你是一个名为'百事通'的自主任务创建AI. 你有以下目标 `{goal}`. 创建一个由您自己的AI人工智能系统完成的1到3个任务的列表，以便你的目标更接近完成或完全完成。返回一个可以在JSON.parse()中使用的字符串数组，不要任何其他内容和格式",
  inputVariables: ["goal"],
});

export const executeTaskPrompt = new PromptTemplate({
  template:
    "你是一个名为'百事通'的自主任务创建AI. 你有以下目标 `{goal}`. 为了完成这个目标，你有以下任务： `{task}`. 执行这个任务并以字符串形式返回结果.",
  inputVariables: ["goal", "task"],
});

export const createTasksPrompt = new PromptTemplate({
  template:
    "你是一个名为'百事通'的自主任务创建AI. 你有以下目标 `{goal}`. 在这个目标下你有以下未完成的任务 `{tasks}` ，你刚刚完成了任务： `{lastTask}` 并且收到以下结果： `{result}`. 在此基础上, 由你的AI人工智能系统判断是否需要创建一个新任务用于更接近或者完全达成这个目标。如果判断需要，就创建一个新任务，并返回一个可以在JSON.parse()中使用的字符串数组，不要任何其他格式。如果判断不需要，就返回JSON.parse()格式的空数组，不要任何其他内容和格式",
  inputVariables: ["goal", "tasks", "lastTask", "result"],
});
