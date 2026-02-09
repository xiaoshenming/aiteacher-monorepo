// routes/changelog.js
const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.get("/", (req, res) => {
  const query = "SELECT * FROM changelog ORDER BY updateTime DESC";
  db.execute(query, (err, results) => {
    if (err) {
      console.error("获取更新日志失败:", err);
      return res
        .status(500)
        .json({ code: 500, message: "获取更新日志失败", data: null });
    }
    res.json({
      code: 200,
      message: "获取更新日志成功",
      data: results,
    });
  });
});

module.exports = router;
