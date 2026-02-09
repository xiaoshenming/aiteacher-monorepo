const express = require("express");
const authorize = require("../auth/authUtils");

const router = express.Router();

router.get("/test/user", authorize(["2", "3", "4"]), (req, res) => {
  res.json({
    code: 200,
    message: "普通用户访问成功",
    data: { role: req.user.role, message: "你已成功访问普通用户接口" },
  });
});

router.get("/test/admin", authorize(["3", "4"]), (req, res) => {
  res.json({
    code: 200,
    message: "管理员访问成功",
    data: { role: req.user.role, message: "你已成功访问管理员接口" },
  });
});

router.get("/test/superadmin", authorize(["4"]), (req, res) => {
  res.json({
    code: 200,
    message: "超级管理员访问成功",
    data: { role: req.user.role, message: "你已成功访问超级管理员接口" },
  });
});

router.get("/test/admin-superadmin", authorize(["3", "4"]), (req, res) => {
  res.json({
    code: 200,
    message: "管理员或超级管理员访问成功",
    data: {
      role: req.user.role,
      message: "你已成功访问管理员或超级管理员接口",
    },
  });
});

module.exports = router;
