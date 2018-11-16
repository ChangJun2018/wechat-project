const xml2js = require('xml2js') // 解析xml的模块

const template = require('./tpl') // 微信自定义回复模板

/**
 * 解析xml到对象
 */
exports.parseXML = xml => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { trim: true }, (err, content) => {
      if (err) reject(err)
      else resolve(content)
    })
  })
}

// 把解析的xml转成一个json对象
const formatMessage = result => {
  let message = {}

  if (typeof result === 'object') {
    const keys = Object.keys(result)

    for (let i = 0; i < keys.length; i++) {
      let item = result[keys[i]]
      let key = keys[i]
      if (!(item instanceof Array) || item.length === 0) {
        continue
      }
      if (item.length === 1) {
        let val = item[0]
        if (typeof val === 'object') {
          message[key] = formatMessage(val)
        } else {
          message[key] = (val || '').trim()
        }
      } else {
        message[key] = []
        for (let j = 0; j < item.length; j++) {
          message[key].push(formatMessage(item[j]))
        }
      }
    }
  }
  return message
}

/**
 * @desc 生成回复微信的xml模版
 * content 内容
 * message 消息
 */
exports.tpl = (content, message) => {

  // 默认是文本
  let type = 'text'

  // 图文消息
  if (Array.isArray(content)) {
    type = 'news'
  }

  // 空消息
  if (!content) content = 'Empty News'

  // 非图文非文本
  if (content && content.type) {
    type = content.type
  }

  let info = Object.assign(
    {},
    {
      content: content, // 内容
      msgType: type, // 消息类型
      createTime: new Date().getTime(), //当前时间
      toUserName: message.FromUserName, // 开发者微信号
      fromUserName: message.ToUserName // 发送方帐号
    }
  )
    
  return template(info) // 将对象传入template方法中生成xml模版
}

exports.formatMessage = formatMessage
