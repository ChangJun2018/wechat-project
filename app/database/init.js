/**
 * @author: Chang Jun
 * @date: 2018/10/5
 * @Description: 初始化MongoDB
 */
const mongoose = require('mongoose')
const { resolve } = require('path') 
const glob = require('glob')  // 匹配文件库

// 将mongoose默认promise修改成默认的Promise
mongoose.Promise = global.Promise

// 初始化所有的Schema
exports.initSchemas = () => {
  glob.sync(resolve(__dirname, './schema', '**/*.js')).forEach(require)
}

// 连接数据库
exports.connect = db => {
  let maxConnectTimes = 0 // 最大连接时长

  return new Promise(resolve => {
    // 开发环境下将调试模式开启
    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', true)
    }
    mongoose.connect(
      db,
      { useNewUrlParser: true }  // 避免警告
    )

    // 如果断开连接之后尝试重新连接
    mongoose.connection.on('disconnect', () => {
      maxConnectTimes++
      if (maxConnectTimes < 5) {
        mongoose.connect(db)
      } else {
        throw new Error('数据库挂了呢')
      }
    })

    // 连接发生错误
    mongoose.connection.on('error', err => {
      maxConnectTimes++
      if (maxConnectTimes < 5) {
        mongoose.connect(db)
      } else {
        throw new Error(err)
      }
    })

    // 连接成功
    mongoose.connection.on('open', () => {
      resolve()
      console.log('MongoDB 连接成功')
    })
  })
}
