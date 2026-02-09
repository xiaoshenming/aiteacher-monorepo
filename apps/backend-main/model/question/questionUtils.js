const axios = require("axios");

// 可通过环境变量配置 AI 接口地址，默认使用 swagger 中提供的地址
const AI_API_BASE_URL =
  process.env.AI_API_BASE_URL || "http://10.23.40.103:8080";

/**
 * 调用 AI 接口生成题目
 * @param {Object} params - 请求参数
 * @param {string|number} params.chatId - 当前聊天室ID
 * @param {number} params.count_direction - 题目数量
 * @param {string} params.direction - 学科，例如 "数学"
 * @param {string} params.questions - 题型，例如 "选择题"
 * @param {string} params.stage - 学习阶段，例如 "高二"
 * @param {number} params.userId - 老师编号
 * @returns {Promise<Object>} 返回接口响应数据
 */
async function generateQuestion({
  chatId,
  count_direction,
  direction,
  questions,
  stage,
  userId,
}) {
  // 构造请求体，根据 swagger 要求所有字段均为必填项
  const payload = {
    chatId: String(chatId), // 保证为字符串
    count_direction,
    direction,
    questions,
    stage,
    userId,
  };

  try {
    const response = await axios.post(
      `${AI_API_BASE_URL}/api/AI/genQuestion`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // 新接口返回格式：code 为 0 表示请求发送成功
    if (response.data && response.data.code === 0) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "生成题目失败");
    }
  } catch (error) {
    console.error("Error calling generateQuestion API:", error.message);
    throw error;
  }
}

/**
 * 调用 AI 接口获取全部问题
 * @param {number} [userId] - 可选的用户ID，用于过滤问题
 * @returns {Promise<Object>} 返回接口响应数据，data 字段为问题数组
 */
async function getAllQuestion(userId) {
  try {
    const response = await axios.get(
      `${AI_API_BASE_URL}/api/AI/GetAllQuestion`,
      {
        params: { userId },
      }
    );
    if (response.data && response.data.code === 0) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "获取全部问题失败");
    }
  } catch (error) {
    console.error("Error calling getAllQuestion API:", error.message);
    throw error;
  }
}

/**
 * 调用 AI 接口生成题解（不插入数据库）
 * @param {Object} params - 请求参数
 * @param {number} params.questionId - 要创建题解问题的Id
 * @param {number} params.userId - 创建题解的用户Id
 * @returns {Promise<Object>} 返回接口响应数据，data 字段为题解文本
 */
async function genQuestionAnswer({ questionId, userId }) {
  // 构造请求体，swagger 要求所有字段均必填
  const payload = {
    questionId,
    userId,
  };

  try {
    const response = await axios.post(
      `${AI_API_BASE_URL}/api/AI/genQuestionAnswer`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data && response.data.code === 0) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "生成题解失败");
    }
  } catch (error) {
    console.error("Error calling genQuestionAnswer API:", error.message);
    throw error;
  }
}

// 导出 API 方法
module.exports = {
  generateQuestion,
  getAllQuestion,
  genQuestionAnswer,
};
