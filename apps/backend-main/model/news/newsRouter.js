// newsRouter.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

// 从环境变量中获取 API 密钥
const appid = process.env.NEWS_API_APPID;
const secret = process.env.NEWS_API_SECRET;

/**
 * 接口1：
 * 接口地址： https://www.mxnzp.com/api/news/types/v2
 * 返回格式： JSON
 * 请求方式： GET
 * 请求示例： https://www.mxnzp.com/api/news/types/v2?app_id=你的APPID&app_secret=你的SECRET
 * 接口备注： V2-获取所有新闻类型列表。
 *
 * 无需传入额外参数，直接使用环境变量中的 appid 和 secret 调用。
 */
router.get('/types', async (req, res) => {
  try {
    const response = await axios.get('https://www.mxnzp.com/api/news/types/v2', {
      params: {
        app_id: appid,
        app_secret: secret
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('获取新闻类型失败：', error);
    res.status(500).json({ code: 500, message: '获取新闻类型失败', error: error.message });
  }
});

/**
 * 接口2：
 * 接口地址： https://www.mxnzp.com/api/news/list/v2
 * 返回格式： JSON
 * 请求方式： GET
 * 请求示例： https://www.mxnzp.com/api/news/list/v2?typeId=532&page=1&app_id=你的APPID&app_secret=你的SECRET
 * 接口备注： V2-获取指定新闻类型的新闻列表。
 *
 * 参数说明：
 *   - typeId (必传)：新闻类型ID
 *   - page (可选)：页码，默认为1
 */
router.get('/list', async (req, res) => {
  const { typeId, page = 1 } = req.query;
  
  // 判断是否传入必需的 typeId 参数
  if (!typeId) {
    return res.status(400).json({ code: 400, message: '缺少 typeId 参数' });
  }

  try {
    const response = await axios.get('https://www.mxnzp.com/api/news/list/v2', {
      params: {
        typeId,
        page,
        app_id: appid,
        app_secret: secret
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('获取新闻列表失败：', error);
    res.status(500).json({ code: 500, message: '获取新闻列表失败', error: error.message });
  }
});

module.exports = router;
