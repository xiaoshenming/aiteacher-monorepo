const path = require("path");
const express = require("express");
const authorize = require("../auth/authUtils"); // 鉴权中间件

module.exports = function staticFiles(app) {
  app.use(
    "/static/imgs",
    express.static(path.join(__dirname, "../../static/imgs"))
  ); // 提供公开静态图片资源
  app.use(
    "/static/img",
    authorize(["2", "3", "4"]),
    express.static(path.join(__dirname, "../../static/img"))
  ); // 提供受限静态图片资源（需鉴权）
  app.use(
    "/static/word",
    express.static(path.join(__dirname, "../../static/word"))
  ); // 提供公开 Word 资源
};
