// 这个路由为测试路由

// 导入包
const express = require("express")

// 创建路由
const Router = express.Router()

// getAccount路由
Router.get("/api-test",(req,res)=>{
  res.json({
    code:200,
    message:"请求成功",
    data: null,
  })
})

// 暴露路由
module.exports = Router