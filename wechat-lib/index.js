/*
 * 获取token以及管理微信素材
 *
 * */
const fs = require('fs')
const request = require('request-promise') // 将request请求promise化

const base = 'https://api.weixin.qq.com/cgi-bin/' // 请求微信api基础地址
const mpBase = 'https://mp.weixin.qq.com/cgi-bin/' // 通过ticket获取二维码
const semanticUrl = 'https://api.weixin.qq.com/semantic/semproxy/search?' // 语义理解

const api = {
  accessToken: base + 'token?grant_type=client_credential', // 获取票据accessToken
  temporary: {
    upload: base + 'media/upload?', // 上传临时素材
    fetch: base + 'media/get?' // 获取临时素材
  },
  permanent: {
    upload: base + 'material/add_material?', // 新增其他类型永久素材
    uploadNews: base + 'material/add_news?', // 新增永久图文素材
    uploadNewsPic: base + 'media/uploadimg?', // 上传图片返回一个url
    fetch: base + 'material/get_material?', // 获取永久素材
    del: base + 'material/del_material?', // 删除永久素材
    update: base + 'material/update_news?', // 修改永久图文素材
    count: base + 'material/get_materialcount?', // 获取素材数量
    batch: base + 'material/batchget_material?' // 获取素材列表
  },
  tag: {
    create: base + 'tags/create?', // 创建标签
    fetch: base + 'tags/get?', // 获取公众号已创建的标签
    update: base + 'tags/update?', // 编辑标签
    del: base + 'tags/delete?', //  删除标签
    fetchUsers: base + 'user/tag/get?', // 获取标签下粉丝列表
    batchTag: base + 'tags/members/batchtagging?', // 批量为用户打标签
    batchUnTag: base + 'tags/members/batchuntagging?', // 批量为用户取消标签
    getUserTags: base + 'tags/getidlist?' // 获取用户身上的标签列表
  },
  user: {
    fetch: base + 'user/get?', // 获取用户列表
    remark: base + 'user/info/updateremark?', // 给用户设置别名
    info: base + 'user/info?', // 获取用户信息
    batch: base + 'user/info/batchget?' // 批量获取用户信息
  },
  qrcode: {
    create: base + 'qrcode/create?', // 创建二维码ticket
    show: mpBase + 'showqrcode?' // 通过ticket换取二维码
  },

  shortUrl: {
    create: base + 'shorturl?' // 将一条长链接转成短链接。
  },

  ai: {
    translate: base + 'media/voice/translatecontent?' // 微信翻译
  }
}

module.exports = class Wechat {
  constructor(opts) {
    this.opts = Object.assign({}, opts)
    this.appID = opts.appID
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken
    this.fetchAccessToken()
  }

  /**
   * 对request请求的封装
   * @param {*} options 请求参数
   */
  async request(options) {
    options = Object.assign({}, options, { json: true })
    try {
      const res = await request(options)
      return res
    } catch (err) {
      console.log(err)
    }
  }

  /* 获取token
   *  1. 检验数据库中的token是否过期
   *  2. 过期则刷新当前token
   *  3. token入库
   * */
  async fetchAccessToken() {
    // 获取数据库中的token
    let data = await this.getAccessToken()

    // 检查token是否过期
    if (!this.isValidToken(data)) {
      data = await this.updateAccessToken()
    }
    // 将token进行保存
    await this.saveAccessToken(data)
    return data
  }

  /**
   * 获取token的方法
   */
  async updateAccessToken() {
    const url = `${api.accessToken}&appid=${this.appID}&secret=${
      this.appSecret
    }`
    const data = await this.request({ url })
    const now = new Date().getTime()
    // token失效时间设置小于两小时
    const expiresIn = now + (data.expires_in - 20) * 1000
    data.expires_in = expiresIn
    return data
  }

  /**
   * 检查token是否过期
   * 过期时间与当前时间比较
   * @param {*} data
   */
  isValidToken(data) {
    if (!data || !data.expires_in) {
      return false
    }
    const expiresIn = data.expires_in // 获取过期时间
    const now = new Date().getTime()
    // 如果现在的时间小于过期时间
    if (now < expiresIn) {
      return true
    } else {
      return false
    }
  }

  /**
   * 上传素材
   * @param {*} token 票据token
   * @param {*} type 素材类型
   * @param {*} material 素材文件路径
   * @param {*} permanent 临时或者永久 默认临时
   */
  uploadMaterial(token, type, material, permanent = false) {
    let form = {} // 存储表单数据

    // 获取上传地址
    let url = api.temporary.upload // 默认是临时素材上传地址

    // 判断是否是上传永久还是临时素材
    if (permanent) {
      url = api.permanent.upload
      form = Object.assign(form, permanent) // form是个obj，继承外面传入的新对象
    }

    // 上传图文消息的图片素材
    if (type === 'pic') {
      url = api.permanent.uploadNewsPic
    }

    // 图文和非图文的素材提交表单切换
    if (type === 'news') {
      url = api.permanent.uploadNews
      form = material
    } else {
      // 创建文件流（文件路径）挂载到form下面的media属性中
      form.media = fs.createReadStream(material)
    }

    // 生成新的上传地址
    let uploadUrl = `${url}access_token=${token}`

    // 根据素材永久性填充token
    if (!permanent) {
      uploadUrl += `&type=${type}`
    } else {
      if (type != 'news') {
        form.access_token = token
      }
    }

    const options = {
      method: 'POST',
      url: uploadUrl,
      json: true
    }

    // 图文和非图文在request提交主题判断
    if (type === 'news') {
      options.body = form
    } else {
      options.formData = form
    }

    return options
  }

  /**
   * 获取素材本身
   * @param {*} token 票据access_token
   * @param {*} mediaId 媒体文件ID
   * @param {*} type 类型
   * @param {*} permanent 临时or永久
   */
  fetchMaterial(token, mediaId, type, permanent) {
    let form = {}
    let fetchUrl = api.temporary.fetch // 默认获取临时素材

    if (permanent) {
      fetchUrl = api.permanent.fetch
    }
    let url = fetchUrl + 'access_token=' + token
    let options = { method: 'POST', url }

    if (permanent) {
      form.media_id = mediaId // 要获取的素材的media_id
      form.access_token = token // 调用接口凭证
      options.body = form
    } else {
      if (type === 'video') {
        url = url.replace('https:', 'http:') // 获取临时视频文件素材时不支持https下载，调用该接口需http协议
      }

      url += '&media_id=' + mediaId
    }

    return options
  }

  /**
   * 删除素材
   * @param {*} token 票据accessToken
   * @param {*} mediaId 媒体文件ID
   */
  deleteMaterial(token, mediaId) {
    const form = {
      media_id: mediaId
    }
    const url = `${api.permanent.del}access_token=${token}&media_id=${mediaId}`

    return { method: 'POST', url, body: form }
  }

  /**
   * 更新素材
   * @param {*} token 票据accessToken
   * @param {*} mediaId 媒体文件ID
   * @param {*} news 修改的图文素材
   */
  updateMaterial(token, mediaId, news) {
    let form = {
      media_id: mediaId
    }
    form = Object.assign(form, news)

    const url = `${
      api.permanent.update
    }access_token=${token}&media_id=${mediaId}`

    return { method: 'POST', url, body: form }
  }

  /**
   * 获取素材总数
   * @param {*} token // 接口调用凭证
   */
  countMaterial(token) {
    const url = `${api.permanent.count}access_token=${token}`
    return { method: 'POST', url }
  }

  /**
   * 获取素材列表
   * @param {*} token 票据token
   * @param {*} options 参数
   */
  batchMaterial(token, options) {
    options.type = options.type || 'image' // 素材的类型
    options.offset = options.offset || 0 // 从全部素材的该偏移位置开始返回，0表示从第一个素材 返回
    options.count = options.count || 10 // 返回素材的数量，取值在1到20之间

    const url = `${api.permanent.batch}access_token=${token}`

    return { method: 'POST', url, body: options }
  }

  /**
   * 创建标签
   * @param {*} token 调用接口凭据
   * @param {*} name 标签名（30个字符以内）
   */
  createTag(token, name) {
    const body = {
      tag: {
        name
      }
    }

    const url = api.tag.create + 'access_token=' + token

    return { method: 'POST', url, body }
  }

  /**
   * 获取全部的标签
   * @param {*} token 调用接口凭据
   */
  fetchTags(token) {
    const url = api.tag.fetch + 'access_token=' + token
    return { url }
  }

  /**
   * 编辑标签
   * @param {*} token 调用接口凭据
   * @param {*} id 标签id，由微信分配
   * @param {*} name 标签名，UTF8编码
   */
  updateTag(token, id, name) {
    const body = {
      tag: {
        id,
        name
      }
    }

    const url = api.tag.update + 'access_token=' + token
    return { method: 'POST', url, body }
  }

  /**
   * 删除标签
   * @param {*} token 调用接口凭据
   * @param {*} id 标签id，由微信分配
   */
  delTag(token, id) {
    const body = {
      tag: {
        id
      }
    }
    const url = api.tag.del + 'access_token=' + token
    return { method: 'POST', url, body }
  }

  /**
   * 获取标签下的粉丝列表
   * @param {*} token 调用接口凭据
   * @param {*} id 标签id，由微信分配
   * @param {*} openId 用户标识
   */
  fetchTagUsers(token, id, openId) {
    const body = {
      tagid: id,
      next_openid: openId || ''
    }

    const url = api.tag.fetchUsers + 'access_token=' + token

    return { method: 'POST', url, body }
  }

  /**
   * 批量加标签和取消标签
   * @param {*} token 调用接口凭据
   * @param {*} openidList 粉丝列表
   * @param {*} id 标签id，由微信分配
   * @param {*} unTag 加还是取消
   */
  batchTag(token, openidList, id, unTag) {
    const body = {
      openid_list: openidList,
      tagid: id
    }
    // 判断是增加还是取消
    let url = !unTag ? api.tag.batchTag : api.tag.batchUnTag
    url += 'access_token=' + token
    return { method: 'POST', url, body }
  }

  /**
   * 获取用户的标签
   * @param {*} token 调用接口凭据
   * @param {*} openId 用户标识
   */
  getUserTags(token, openId) {
    const body = {
      openid: openId
    }
    const url = api.tag.getUserTags + 'access_token=' + token
    return { method: 'POST', url, body }
  }

  /**
   * 获取用户列表
   * @param {*} token 调用接口凭据
   * @param {*} openId 用户标识
   */
  fetchUserList(token, openId) {
    const url =
      api.user.fetch +
      'access_token=' +
      token +
      '&next_openid=' +
      (openId || '')
    return { url }
  }

  /**
   * 给用户设置别名
   * @param {*} token 调用接口凭据
   * @param {*} openId 用户标识
   * @param {*} remark 新的备注名，长度必须小于30字符
   */
  remarkUser(token, openId, remark) {
    const body = {
      openid: openId,
      remark
    }
    const url = api.user.remark + 'access_token=' + token
    return { method: 'POST', url, body }
  }

  /**
   * 获取用户的详细信息
   * @param {*} token  调用接口凭证
   * @param {*} openId 普通用户的标识，对当前公众号唯一
   * @param {*} lan 返回国家地区语言版本，zh_CN 简体，zh_TW 繁体，en 英语
   */
  getUserInfo(token, openId, lan = 'zh_CN') {
    const url =
      api.user.info +
      'access_token=' +
      token +
      '&openid=' +
      openId +
      '&lang=' +
      lan
    return { url }
  }

  /**
   * 批量获取用户信息
   * @param {*} token 调用接口凭证
   * @param {*} openIdList user_list
   */
  fetchBatchUsers(token, openIdList) {
    const body = {
      user_list: openIdList
    }
    const url = api.user.batch + 'access_token=' + token
    return { method: 'POST', url, body }
  }

  /**
   * 创建二维码 Ticket
   * @param {*} token 调用接口凭证
   * @param {*} qr 相关参数
   */
  createQrcode (token, qr) {
    const url = api.qrcode.create + 'access_token=' + token
    const body = qr
    return { method: 'POST', url, body }
  }

  /**
   * 通过 Ticket 换取二维码
   * @param {*} ticket 获取的二维码ticket，凭借此ticket可以在有效时间内换取二维码。
   */
  showQrcode (ticket) {
    const url = api.qrcode.show + 'ticket=' + encodeURI(ticket)
    return url
  }

  /**
   * 常链接转短链接
   * @param {*} token 调用接口凭证
   * @param {*} action 此处填long2short，代表长链接转短链接
   * @param {*} longurl 需要转换的长链接，支持http://、https://、weixin://wxpay 格式的url
   */
  createShortUrl (token, action = 'long2short', longurl) {
    const url = api.shortUrl.create + 'access_token=' + token
    const body = {
      action,
      long_url: longurl
    }
    return { method: 'POST', url, body }
  }

  /**
   * 语义理解-查询特定的语句进行分析
   * @param {*} token 接口调用凭证
   * @param {*} semanticData 数据
   */
  semantic (token, semanticData) {
    const url = api.semanticUrl + 'access_token=' + token
    semanticData.appid = this.appID
    return { method: 'POST', url, body: semanticData }
  }

  /**
   * 微信翻译
   * @param {*} token 	接口调用凭证
   * @param {*} body  源内容
   * @param {*} lfrom 源语言
   * @param {*} lto 目标语言
   */
  aiTranslate (token, body, lfrom, lto) {
    const url = api.ai.translate + 'access_token=' + token + '&lfrom=' + lfrom + '&lto=' + lto
    return { method: 'POST', url, body }
  }

  /**
   * 封装通用请求
   * @param {*} operation 要调用的方法
   * @param  {...any} args 传递的参数
   */
  async handle(operation, ...args) {
    // 获取票据token
    const tokenData = await this.fetchAccessToken()
    // 获取要调用方法返回的参数
    const options = this[operation](tokenData.access_token, ...args)
    // 发送上传请求
    const data = await this.request(options)
    return data
  }
}
