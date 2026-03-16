const express = require("express");
const Router = express.Router();
const authorize = require("../auth/authUtils");
const logger = require("../../utils/logger");
const {
  getTree, getChildren, createNode, updateNode, deleteNode,
  attachResource, detachResource, getNodeResources,
} = require("./knowledgeTreeUtils");

// 获取知识树
Router.get("/", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const data = await getTree(req.query);
    res.json({ code: 200, message: "查询成功", data });
  } catch (err) {
    logger.error("获取知识树失败:", err);
    res.status(500).json({ code: 500, message: "查询失败" });
  }
});

// 获取子节点
Router.get("/:id/children", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const data = await getChildren(req.params.id);
    res.json({ code: 200, message: "查询成功", data });
  } catch (err) {
    logger.error("获取子节点失败:", err);
    res.status(500).json({ code: 500, message: "查询失败" });
  }
});

// 创建节点
Router.post("/", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const data = await createNode({ ...req.body, created_by: req.user.id });
    res.json({ code: 200, message: "创建成功", data });
  } catch (err) {
    logger.error("创建节点失败:", err);
    res.status(500).json({ code: 500, message: "创建失败" });
  }
});

// 更新节点
Router.put("/:id", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    await updateNode(req.params.id, req.body);
    res.json({ code: 200, message: "更新成功" });
  } catch (err) {
    logger.error("更新节点失败:", err);
    res.status(500).json({ code: 500, message: "更新失败" });
  }
});

// 删除节点（级联）
Router.delete("/:id", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    await deleteNode(req.params.id);
    res.json({ code: 200, message: "删除成功" });
  } catch (err) {
    logger.error("删除节点失败:", err);
    res.status(500).json({ code: 500, message: "删除失败" });
  }
});

// 挂载资源
Router.post("/:id/resources", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;
    const data = await attachResource(req.params.id, resource_type, resource_id, req.user.id);
    res.json({ code: 200, message: "挂载成功", data });
  } catch (err) {
    logger.error("挂载资源失败:", err);
    res.status(500).json({ code: 500, message: "挂载失败" });
  }
});

// 取消挂载
Router.delete("/:id/resources/:mapId", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    await detachResource(req.params.mapId);
    res.json({ code: 200, message: "取消挂载成功" });
  } catch (err) {
    logger.error("取消挂载失败:", err);
    res.status(500).json({ code: 500, message: "取消挂载失败" });
  }
});

// 获取节点资源
Router.get("/:id/resources", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const data = await getNodeResources(req.params.id, Number(page), Number(pageSize));
    res.json({ code: 200, message: "查询成功", data });
  } catch (err) {
    logger.error("获取节点资源失败:", err);
    res.status(500).json({ code: 500, message: "查询失败" });
  }
});

module.exports = Router;
