// model\question\questionRouter.js
const express = require("express");
const router = express.Router();

// 引入封装好的 AI 接口方法（注意文件路径根据实际情况调整）
const {
  generateQuestion,
  getAllQuestion,
  genQuestionAnswer,
} = require("./questionUtils");

/**
 * @route   POST /api/bridge/genQuestion
 * @desc    调用 AI 接口生成题目
 * @access  Public
 */
router.post("/genQuestion", async (req, res) => {
  try {
    const { chatId, count_direction, direction, questions, stage, userId } =
      req.body;
    // 输入校验可以根据实际需求扩展

    const result = await generateQuestion({
      chatId,
      count_direction,
      direction,
      questions,
      stage,
      userId,
    });
    res.json(result);
  } catch (err) {
    console.error("Error generating question:", err.message);
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * @route   GET /api/bridge/getAllQuestion
 * @desc    获取所有问题，可通过 userId 进行筛选
 * @access  Public
 */
router.get("/getAllQuestion", async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await getAllQuestion(userId);
    res.json(result);
  } catch (err) {
    console.error("Error getting all questions:", err.message);
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * @route   POST /api/bridge/genQuestionAnswer
 * @desc    调用 AI 接口生成题解
 * @access  Public
 */
router.post("/genQuestionAnswer", async (req, res) => {
  try {
    const { questionId, userId } = req.body;
    const result = await genQuestionAnswer({ questionId, userId });
    res.json(result);
  } catch (err) {
    console.error("Error generating question answer:", err.message);
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

module.exports = router;
