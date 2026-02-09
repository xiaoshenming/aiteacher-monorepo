// 该工具类用于通过传入临时凭证code获取openid(微信用户唯一标识)

const axios = require('axios');
require("dotenv").config();
// 微信临时登录凭证换取用户信息的 API 地址
const wxApiUrl = 'https://api.weixin.qq.com/sns/jscode2session';

// 小程序的 appid 和 secret
const wxAppId = process.env.wxAppId || "wx7fb482dc9fbc8192";
const wxAppSecret =
  process.env.wxAppSecret || "b15224703e3c80f05670e605bee6ad51";

// 获取 openid 的函数
async function getOpenid(code) {
    try {
        // 请求微信 API 获取用户信息
        const response = await axios.get(wxApiUrl, {
            params: {
                appid: wxAppId,
                secret: wxAppSecret,
                js_code: code,
                grant_type: 'authorization_code'
            }
        });

        // 如果成功，返回 openid 和 session_key
        const { session_key, openid } = response.data;
        if (openid) {
            return { openid, session_key };
        } else {
            throw new Error('微信 API 请求失败，未获取到 openid');
        }
    } catch (error) {
        throw new Error(`获取 openid 失败: ${error.message}`);
    }
}

module.exports = { getOpenid };
