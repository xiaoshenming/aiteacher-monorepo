const OpenAI = require("openai");
const APIKEY = process.env.DEEPSEEK_API_KEY || "xxxxxxxx";
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: APIKEY,
});

/**
 * 启用流式传输获取 AI 响应
 * @param {string} prompt 用户输入的提示词
 * @param {Function} [callback] 每接收到一个 chunk 时调用的回调函数
 * @param {string} [model] 使用的模型，默认为 "deepseek-chat"
 * @returns {Promise<string>} 最终完整的响应
 */
async function getAIResponseStream(prompt, callback, model = "deepseek-chat") {
  try {
    const stream = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      model: model,
      stream: true, // 启用流式传输
    });

    let fullResponse = "";
    // 遍历流数据，每个 chunk 均调用回调
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      if (callback) {
        callback(content);
      }
    }
    return fullResponse;
  } catch (error) {
    console.error("Error fetching AI response stream:", error);
    throw new Error("Failed to fetch AI response stream");
  }
}

/**
 * 不启用流式传输获取 AI 响应（同步获取完整响应）
 * @param {string} prompt 用户输入的提示词
 * @param {string} [model] 使用的模型，默认为 "deepseek-chat"
 * @returns {Promise<string>} 返回完整的响应内容
 */
async function getAIResponse(prompt, model = "deepseek-chat") {
  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      model: model,
      stream: false,
    });
    const fullResponse = response.choices[0]?.message?.content || "";
    return fullResponse;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to fetch AI response");
  }
}

module.exports = { getAIResponseStream, getAIResponse };
