const Koa = require('koa');
const config = require('./config/config');
const wechat = require('./wechat-lib/middleware');
const {reply} = require('./wechat/reply');
const {initSchemas, connect} = require('./app/database/init');

(async () => {
  // 连接数据库
  await connect(config.db);
  // 初始化文档模型
  initSchemas();
  // 生成Koa实例
  const app = new Koa();
  // 配置回复中间件儿
  app.use(wechat(config.wechat, reply));
  app.listen(3008, () => {
    console.log('服务器已经启动成功,端口号3008')
  });
})();


