// pptController.js
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const jwt = require("jsonwebtoken");
// 引入鉴权中间件，只有角色为2,3,4的用户才可访问
const authorize = require("../auth/authUtils");
// 数据库操作模块（需提前配置好 db 模块）
const db = require("../../config/db");
// PPT 服务接口
const {
  generateApiToken,
  generatePptx,
  downloadPptx,
} = require("./pptUtils");

const router = express.Router();

// SSO shared secret - must match LandPPT backend
const SSO_SECRET = "aiteacher-landppt-sso-secret-2024";

// 从环境变量中获取云盘端口号
const cloudPort = process.env.CLOUD_BACKEND_PORT;

/**
 * POST /api/ppt/sso-token
 * Generate SSO token for LandPPT iframe integration
 */
router.post("/sso-token", authorize(["0", "1", "2", "3", "4"]), (req, res) => {
  try {
    const { username, user_id, role } = req.body;
    if (!user_id) {
      return res.status(400).json({ code: 400, message: "Missing user_id" });
    }

    // Fallback username to user_id if not provided
    const finalUsername = username || `user_${user_id}`;

    const token = jwt.sign(
      { username: finalUsername, user_id, role, iat: Math.floor(Date.now() / 1000) },
      SSO_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("SSO token generation error:", error);
    return res.status(500).json({ code: 500, message: "Failed to generate SSO token" });
  }
});

/**
 * POST /api/ppt/generateAndDownloadPpt
 *
 * 请求体（JSON）格式：
 * {
 *    "markdownContent": "你的 PPT 内容的 Markdown 格式",
 *    "uid": 可选,    // 如果需要指定 uid（可为 null）
 *    "limit": 可选   // 限制参数（可为 null）
 * }
 *
 * 请求头中需包含鉴权 token 以及设备类型（devicetype）
 *
 * 流程：
 *  1. 根据请求体参数调用生成 API token 接口
 *  2. 利用 API token 生成 PPT（得到 pptId）
 *  3. 利用 pptId 获取下载链接，并通过 axios 下载 PPT 文件（二进制数据）
 *  4. 生成唯一文件名，将文件保存到后端存储目录（绝对路径：E:\计算机类\服创\AI辅助的教师备课系统构建\AITeacherCloudBack\storage\files）
 *  5. 将文件相关信息（文件名、相对路径、大小、类型、lvid 用户 id 等）写入数据库表 file
 *  6. 返回统一格式的 JSON 数据
 */
router.post(
  "/generateAndDownloadPpt",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const { markdownContent, uid = null, limit = null } = req.body;
      if (!markdownContent) {
        return res.status(400).json({
          code: 400,
          message: "缺少 markdownContent 参数",
          data: null,
        });
      }
      // 从鉴权 token 中提取用户 id，作为 lvid
      const lvid = req.user.id;

      // --- 第一步：调用 PPT 服务创建 API token ---
      const tokenResponse = await generateApiToken(uid, limit);
      if (tokenResponse.code !== 0) {
        throw new Error("API token 创建失败");
      }
      const token = tokenResponse.data.token;

      // --- 第二步：调用 PPT 服务生成 PPT ---
      const pptResponse = await generatePptx(token, markdownContent);
      if (pptResponse.code !== 0) {
        throw new Error("PPT 生成失败");
      }
      const pptInfo = pptResponse.data.pptInfo;
      const pptId = pptInfo.id;

      // --- 第三步：获取 PPT 文件下载链接 ---
      const downloadResponse = await downloadPptx(token, pptId);
      if (downloadResponse.code !== 0) {
        throw new Error("下载链接获取失败");
      }
      const fileUrl = downloadResponse.data.fileUrl;

      // --- 第四步：下载 PPT 文件（二进制数据） ---
      const fileDownloadResponse = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      // 生成唯一文件名（仅与文件名有关，不依赖具体服务器路径）
      const timestamp = Date.now();
      const fileName = `ppt-${pptId}-${timestamp}.pptx`;

      // --- 调用内网传递接口，将文件数据传递给云盘服务 ---
      const form = new FormData();
      form.append("file", fileDownloadResponse.data, fileName);
      form.append("lvid", lvid);
      form.append("originalName", fileName);
      form.append(
        "fileType",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      );

      // 内网接口地址，云盘服务端口在env文件中配置
      const uploadUrl = "http://localhost:" + cloudPort + "/api/uploadFile";
      const uploadResponse = await axios.post(uploadUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      if (uploadResponse.data.code !== 200) {
        throw new Error("文件上传至云盘失败");
      }

      // 从云盘接口获取相对路径及文件大小
      const { relativeFilePath, fileSize } = uploadResponse.data.data;

      // --- 第五步：将文件信息存储到数据库 ---
      const insertSql = `
        INSERT INTO file (lvid, name, path, size, type, parent_id, is_folder)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const insertValues = [
        lvid,
        fileName,
        relativeFilePath,
        fileSize,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        null,
        0,
      ];
      const [insertResult] = await db.promise().query(insertSql, insertValues);

      // --- 第六步：返回接口调用成功的信息 ---
      const resultData = {
        fileId: insertResult.insertId,
        fileName,
        filePath: relativeFilePath,
        fileSize,
        pptId,
      };

      return res.json({
        code: 0,
        message: "已经异步生成并存储到网盘",
        data: resultData,
      });
    } catch (error) {
      console.error("PPT 生成及存储过程出错:", error);
      return res.status(500).json({
        code: 500,
        message: "服务器错误，生成 PPT 失败",
        data: null,
      });
    }
  }
);

module.exports = router;
