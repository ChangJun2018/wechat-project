const sha1 = require('sha1') // 加密函数库
const getRawBody = require('raw-body') // 获取原始数据库

const util = require('./util') // 自定义的工具函数库

/**
 * @desc 微信服务器认证的中间件
 * config 微信公众号相关配置
 * reply 回复策略
 */
module.exports = (config, reply) => {
  /**
   * @desc 加载认证中间件儿
   * ctx是Koa的应用上下文
   * next就是串联中间件儿的钩子函数
   */
  return async (ctx, next) => {
    // 接入微信服务器
    // 加密串、时间戳、随机数、随机字符串
    const { signature, timestamp, nonce, echostr } = ctx.query

    const token = config.token

    // 对token、时间戳、随机数进行排序
    let str = [token, timestamp, nonce].sort().join('')

    // 对排序之后的字符串进行加密
    const sha = sha1(str)

    // 进行get和post请求区分，如果是get就是认证
    // 如果是post即是推送消息的
    if (ctx.method === 'GET') {
      if (sha === signature) {
        ctx.body = echostr
      } else {
        ctx.body = 'Failed'
      }
    } else if (ctx.method === 'POST') {
      if (sha !== signature) {
        return (ctx.body = 'Failed')
      }

      // 获取微信post请求的原始数据
      const data = await getRawBody(ctx.req, {
        length: ctx.length, //请求格式
        limit: '1mb', // 请求数据大小
        encoding: ctx.charset // 编码格式
      })

      // 对微信post的xml进行解析成对象
      const content = await util.parseXML(data)

      // 将解析后的xml对象转成一个json对象
      const message = util.formatMessage(content.xml)

      // 将微信发送的消息挂载到上下文中的weixin属性上
      ctx.weixin = message

      // 调用我们定义好的回复策略，传入上下文
      await reply.apply(ctx, [ctx, next])

      // 获取我们回复微信的对象
      const replyBody = ctx.body
      // 获取维信发送的用户信息
      const msg = ctx.weixin

      // 生成回复微信的xml模板
      const xml = util.tpl(replyBody, msg)

      ctx.status = 200
      ctx.type = 'application/xml'
      ctx.body = xml
    }
  }
}
