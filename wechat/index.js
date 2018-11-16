/**
 * @author: Chang Jun
 * @date:   2018/10/5
 * @Description:
 */


const Wechat = require('../wechat-lib');
const config = require('../config/config');
const mongoose = require('mongoose');

const Token = mongoose.model('Token');


const wechatCfg = {

  wechat: {
    appID: config.wechat.appID, // appid 
    appSecret: config.wechat.appSecret, // appsecret
    token: config.wechat.token, // token
    getAccessToken: async () => { 
      const res = await Token.getAccessToken(); // 获取mongodb中的token
      return res
    },
    saveAccessToken: async (data) => {
      const res = await Token.saveAccessToken(data); // 保存token到mongodb
      return res
    },
  }

};


exports.getWechat = () => new Wechat(wechatCfg.wechat);