/**
 * @author: Chang Jun
 * @date: 2018/10/5
 * @Description: Token的数据模型
 */

// Schema 定义MongoDB中集合Collection里文档document的结构 每个schema会映射到mongodb中的一个collection
// Model  model是由schema生成的模型，可以对数据库的操作。
//Entity：由Model创建的实体，可操作数据库。
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 定义表结构
const TokenSchema = new Schema({
  name: String, //accessToken
  token: String, // 内容
  expires_in: Number, // 过期时间
  meta: {
    createdAt: {
      type: Date, // 创建时间
      default: Date.now()
    },
    updatedAt: {
      type: Date, // 更新时间
      default: Date.now()
    }
  }
})

// 前后钩子即pre()和post()方法，又称为中间件，是在执行某些操作时可以执行的函数。中间件在schema上指定，类似于静态方法或实例方法等
// 前后钩子方法即中间件儿
// 在每次进行存储的时候判断token是新增的还是更新
TokenSchema.pre('save', function(next) {
  // 如果该条数据是新增的创建时间就等于更新时间
  if (this.isNew) {
    this.meta.createdAt = this.meta.updatedAt = Date.now()
  } else {
    this.meta.updatedAt = Date.now()
  }

  next()
})

// tokenschema的静态方法
TokenSchema.statics = {
  // 查询数据库中的token
  async getAccessToken() {
    const token = await this.findOne({
      name: 'access_token'
    })

    if (token && token.token) {
      token.access_token = token.token
    }

    return token
  },

  // 将token存储在数据库中
  async saveAccessToken(data) {
    let token = await this.findOne({
      name: 'access_token'
    })

    // 如果token存在更新token相关信息
    if (token) {
      token.token = data.access_token
      token.expires_in = data.expires_in
    } else {
      token = new Token({
        name: 'access_token',
        token: data.access_token,
        expires_in: data.expires_in
      })
    }
    await token.save()
    return data
  }
}

const Token = mongoose.model('Token', TokenSchema)
