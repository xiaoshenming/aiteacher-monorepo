/*
pptService.js

此文件包含调用 Docmee API 的服务函数，
用于生成 API Token、生成 PPT 和下载 PPT。
*/

const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv");

// 加载环境变量
dotenv.config();

// API 密钥和基础 URL
const API_KEY = process.env.AIPPT_API_KEY; // 从 .env 文件中获取 AIPPT_API_KEY
const API_URL = "https://docmee.cn/api";

/**
 * 生成 API Token
 * @param {string|null} uid 用户 ID（可选）
 * @param {number|null} limit 限制数量（可选）
 * @returns {Promise<Object>} 返回 API Token 数据
 */
async function generateApiToken(uid = null, limit = null) {
  try {
    const response = await axios.post(
      `${API_URL}/user/createApiToken`,
      {
        uid,
        limit,
      },
      {
        headers: {
          "Api-Key": API_KEY,
        },
      }
    );
    console.log("生成 API Token 成功，返回数据：", response.data);
    // 检查返回数据中是否包含文件名信息
    const filename = response.data.fileName || response.data.filename;
    if (filename) {
      console.log("文件名数据：", filename);
    }
    return response.data;
  } catch (error) {
    console.error("生成 API Token 时出错：", error);
    throw new Error("生成 API Token 失败");
  }
}

/**
 * 根据 Markdown 内容生成 PPTX 文件
 * @param {string} token API Token
 * @param {string} markdownContent PPT 内容的 Markdown 格式文本
 * @param {boolean} pptxProperty 是否包含 PPTX 属性（默认为 false）
 * @returns {Promise<Object>} 返回生成的 PPTX 数据
 */
async function generatePptx(token, markdownContent, pptxProperty = false) {
  try {
    const response = await axios.post(
      `${API_URL}/ppt/generatePptx`,
      {
        outlineContentMarkdown: markdownContent,
        pptxProperty: pptxProperty,
      },
      {
        headers: {
          token: token,
        },
      }
    );
    console.log("生成 PPT 成功，返回数据：", response.data);
    // 检查返回数据中是否包含文件名信息
    const filename = response.data.fileName || response.data.filename;
    if (filename) {
      console.log("文件名数据：", filename);
    }
    return response.data;
  } catch (error) {
    console.error("生成 PPT 时出错：", error);
    throw new Error("生成 PPT 失败");
  }
}

/**
 * 下载 PPTX 文件
 * @param {string} token API Token
 * @param {string} pptId PPT 的 ID
 * @returns {Promise<Object>} 返回下载的 PPTX 数据
 */
async function downloadPptx(token, pptId) {
  try {
    const response = await axios.post(
      `${API_URL}/ppt/downloadPptx`,
      {
        id: pptId,
        refresh: false,
      },
      {
        headers: {
          token: token,
        },
      }
    );
    console.log("下载 PPT 成功，返回数据：", response.data);
    // 检查返回数据中是否包含文件名信息
    const filename = response.data.fileName || response.data.filename;
    if (filename) {
      console.log("文件名数据：", filename);
    }
    return response.data;
  } catch (error) {
    console.error("下载 PPT 时出错：", error);
    throw new Error("下载 PPT 失败");
  }
}

module.exports = { generateApiToken, generatePptx, downloadPptx };
