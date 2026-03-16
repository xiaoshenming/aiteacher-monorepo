const express = require("express");
const router = express.Router();
const authorize = require("../auth/authUtils");
const logger = require("../../utils/logger");
const {
  createShare,
  deleteShare,
  getMyShares,
  getSharedToMe,
  getPublicShares,
  getSchoolShares,
  addFavorite,
  removeFavorite,
  getFavorites,
  createTag,
  deleteTag,
  getTags,
  bindTag,
  unbindTag,
} = require("./shareUtils");

// 所有端点需要教师及以上权限
router.use(authorize(["2", "3", "4"]));

// 创建共享
router.post("/", async (req, res) => {
  try {
    const result = await createShare({
      ...req.body,
      sharer_id: req.user.id,
    });
    res.json({ code: 200, message: "共享成功", data: { id: result.insertId } });
  } catch (err) {
    logger.error("创建共享失败:", err);
    res.status(500).json({ code: 500, message: "创建共享失败" });
  }
});

// 撤销共享
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteShare(req.params.id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: "共享记录不存在或无权操作" });
    }
    res.json({ code: 200, message: "已撤销共享" });
  } catch (err) {
    logger.error("撤销共享失败:", err);
    res.status(500).json({ code: 500, message: "撤销共享失败" });
  }
});

// 我分享的
router.get("/my-shares", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const data = await getMyShares(req.user.id, +page, +pageSize);
    res.json({ code: 200, message: "success", data });
  } catch (err) {
    logger.error("获取我的共享失败:", err);
    res.status(500).json({ code: 500, message: "获取失败" });
  }
});

// 分享给我的
router.get("/shared-to-me", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const data = await getSharedToMe(req.user.id, +page, +pageSize);
    res.json({ code: 200, message: "success", data });
  } catch (err) {
    logger.error("获取分享给我的失败:", err);
    res.status(500).json({ code: 500, message: "获取失败" });
  }
});

// 公开广场
router.get("/public", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, resource_type } = req.query;
    const filters = {};
    if (resource_type) filters.resource_type = resource_type;
    const data = await getPublicShares(+page, +pageSize, filters);
    res.json({ code: 200, message: "success", data });
  } catch (err) {
    logger.error("获取公开资源失败:", err);
    res.status(500).json({ code: 500, message: "获取失败" });
  }
});

// 校内共享
router.get("/school", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, school_id } = req.query;
    if (!school_id) {
      return res.status(400).json({ code: 400, message: "缺少 school_id" });
    }
    const data = await getSchoolShares(school_id, +page, +pageSize);
    res.json({ code: 200, message: "success", data });
  } catch (err) {
    logger.error("获取校内共享失败:", err);
    res.status(500).json({ code: 500, message: "获取失败" });
  }
});

// 收藏
router.post("/favorite", async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;
    await addFavorite(req.user.id, resource_type, resource_id);
    res.json({ code: 200, message: "收藏成功" });
  } catch (err) {
    logger.error("收藏失败:", err);
    res.status(500).json({ code: 500, message: "收藏失败" });
  }
});

// 取消收藏
router.delete("/favorite/:id", async (req, res) => {
  try {
    const result = await removeFavorite(req.params.id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: "收藏不存在或无权操作" });
    }
    res.json({ code: 200, message: "已取消收藏" });
  } catch (err) {
    logger.error("取消收藏失败:", err);
    res.status(500).json({ code: 500, message: "取消收藏失败" });
  }
});

// 收藏列表
router.get("/favorites", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const data = await getFavorites(req.user.id, +page, +pageSize);
    res.json({ code: 200, message: "success", data });
  } catch (err) {
    logger.error("获取收藏列表失败:", err);
    res.status(500).json({ code: 500, message: "获取失败" });
  }
});

// 创建标签
router.post("/tag", async (req, res) => {
  try {
    const { name, color } = req.body;
    const result = await createTag(req.user.id, name, color);
    res.json({ code: 200, message: "标签创建成功", data: { id: result.insertId } });
  } catch (err) {
    logger.error("创建标签失败:", err);
    res.status(500).json({ code: 500, message: "创建标签失败" });
  }
});

// 删除标签
router.delete("/tag/:id", async (req, res) => {
  try {
    const result = await deleteTag(req.params.id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: "标签不存在或无权操作" });
    }
    res.json({ code: 200, message: "标签已删除" });
  } catch (err) {
    logger.error("删除标签失败:", err);
    res.status(500).json({ code: 500, message: "删除标签失败" });
  }
});

// 标签列表
router.get("/tags", async (req, res) => {
  try {
    const data = await getTags(req.user.id);
    res.json({ code: 200, message: "success", data });
  } catch (err) {
    logger.error("获取标签列表失败:", err);
    res.status(500).json({ code: 500, message: "获取失败" });
  }
});

// 打标签
router.post("/tag/:id/bind", async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;
    await bindTag(req.params.id, resource_type, resource_id);
    res.json({ code: 200, message: "标签绑定成功" });
  } catch (err) {
    logger.error("绑定标签失败:", err);
    res.status(500).json({ code: 500, message: "绑定标签失败" });
  }
});

// 移除标签
router.delete("/tag/:id/unbind", async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;
    await unbindTag(req.params.id, resource_type, resource_id);
    res.json({ code: 200, message: "标签已移除" });
  } catch (err) {
    logger.error("移除标签失败:", err);
    res.status(500).json({ code: 500, message: "移除标签失败" });
  }
});

module.exports = router;
