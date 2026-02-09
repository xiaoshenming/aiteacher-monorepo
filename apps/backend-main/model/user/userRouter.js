// model/user/userRouter.js
const express = require("express");
const router = express.Router();
const userUtils = require("./userUtils");
const authorize = require("../auth/authUtils");

// 用户注册
router.post("/register", async (req, res) => {
  try {
    const result = await userUtils.registerUser(req.body);
    res.status(201).json({ code: 201, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// PC 登录
router.post("/pc/login", async (req, res) => {
  try {
    const result = await userUtils.loginPC(req.body);
    res.json({ code: 200, message: "登录成功", data: result });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 微信小程序登录
router.post("/mobile/login/wxMiniprogram", async (req, res) => {
  try {
    const result = await userUtils.loginWxMiniprogram(req.body);
    res.json({ code: 200, message: "登录成功", data: result });
  } catch (error) {
    const statusCode = error.code === 211 ? 211 : 400;
    res
      .status(statusCode)
      .json({ code: statusCode, message: error.message, data: null });
  }
});

// 微信小程序绑定
router.post("/mobile/bind/wxMiniprogram", async (req, res) => {
  try {
    const result = await userUtils.bindWxMiniprogram(req.body);
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 微信小程序注册
router.post("/mobile/register/wxMiniprogram", async (req, res) => {
  try {
    const result = await userUtils.registerWxMiniprogram(req.body);
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 用户退出（受保护接口）
router.post("/logout", authorize(["0","1", "2", "3", "4"]), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const deviceType = req.headers.devicetype;
    const result = await userUtils.logoutUser({ token, deviceType });
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(401).json({ code: 401, message: error.message, data: null });
  }
});

// 获取用户状态
router.get("/status", authorize(["0","1", "2", "3", "4"]), async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "用户已登录",
      data: { loggedIn: true, user: req.user },
    });
  } catch (error) {
    res.json({ code: 200, message: "用户未登录", data: { loggedIn: false } });
  }
});

// 获取用户详细信息
router.get("/user", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  try {
    const result = await userUtils.getUserInfo(req.user.id);
    res.json({ code: 200, message: "获取用户信息成功", data: result });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 更新用户信息
router.put("/user", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const { type, data } = req.body;
    const result = await userUtils.updateUserInfo(req.user.id, { type, data });
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 上传头像
router.post(
  "/avatar",
  authorize(["0", "1", "2", "3", "4"]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.avatar) {
        return res
          .status(400)
          .json({ code: 400, message: "请选择要上传的头像文件", data: null });
      }
      const result = await userUtils.uploadAvatar({
        userId: req.user.id,
        avatar: req.files.avatar,
      });
      res.json({
        code: 200,
        message: result.message,
        data: { url: result.url, avatar_id: result.avatar_id },
      });
    } catch (error) {
      const statusCode = error.message.includes("maxFileSize exceeded")
        ? 413
        : 500;
      res
        .status(statusCode)
        .json({ code: statusCode, message: error.message, data: null });
    }
  }
);

// 更新头像 URL
router.put("/user/avatar", authorize(["0","1", "2", "3", "4"]), async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return res
        .status(400)
        .json({ code: 400, message: "无效的头像URL", data: null });
    }
    const result = await userUtils.updateUserAvatar(req.user.id, avatarUrl);
    res.json({
      code: 200,
      message: result.message,
      data: { avatar: result.avatar },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 更新通讯录
router.post(
  "/user/phoneList/modifiy",
  authorize(["1", "2", "3", "4"]),
  async (req, res) => {
    try {
      const { phoneList } = req.body;
      const result = await userUtils.updatePhoneList(req.user.id, phoneList);
      res.json({ code: 200, message: result.message, data: null });
    } catch (error) {
      res.status(400).json({ code: 400, message: error.message, data: null });
    }
  }
);

// 获取当前用户通讯录
router.get(
  "/user/phoneList/get",
  authorize(["1", "2", "3", "4"]),
  async (req, res) => {
    try {
      const result = await userUtils.getPhoneList(req.user.id);
      res.json({
        code: 200,
        message: "获取通讯录成功",
        data: { phoneList: result },
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: error.message, data: null });
    }
  }
);

// 分页获取本校通讯录（query参数：pageIndex, pageSize）
router.get(
  "/user/phoneList/getSchool",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const { pageIndex, pageSize } = req.query;
      const result = await userUtils.getSchoolPhoneList(
        req.user.id,
        parseInt(pageIndex),
        parseInt(pageSize)
      );
      res.json({ code: 200, message: "获取通讯录成功", data: result });
    } catch (error) {
      res.status(500).json({ code: 500, message: error.message, data: null });
    }
  }
);

// 搜索本校通讯录（POST）
router.post(
  "/user/phoneList/searchSchool",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const { keyword, pageIndex, pageSize } = req.body;
      if (!keyword) {
        return res
          .status(400)
          .json({ code: 400, message: "搜索关键字不能为空", data: null });
      }
      const result = await userUtils.searchSchoolPhoneList(
        req.user.id,
        keyword,
        parseInt(pageIndex),
        parseInt(pageSize)
      );
      res.json({ code: 200, message: "搜索通讯录成功", data: result });
    } catch (error) {
      res.status(500).json({ code: 500, message: error.message, data: null });
    }
  }
);
// 获取所有学校名称
router.get("/school/all", authorize(["0","1", "2", "3", "4"]), async (req, res) => {
  try {
    const schools = await userUtils.getAllSchools();
    res.json({
      code: 200,
      message: "获取所有学校名称成功",
      data: schools,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "服务器错误，获取所有学校名称失败",
      data: null,
    });
  }
});
// 获取本校教师列表
router.get("/teachers", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const teachers = await userUtils.getSchoolTeachers(req.user.id);
    res.json({ code: 200, message: "查询成功", data: { teachers } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});
module.exports = router;
