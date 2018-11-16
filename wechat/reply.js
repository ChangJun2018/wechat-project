const { resolve } = require('path')

exports.reply = async (ctx, next) => {
  const message = ctx.weixin // 获取微信发送的消息

  let mp = require('./index')

  // 创建getWechat实例
  let client = mp.getWechat()
  if (message.MsgType === 'event') {
    let reply = ''
    if (message.Event === 'LOCATION') {
      reply = `您的位置是：${message.Latitude}-${message.Longitude}-${
        message.Precision
      }`
    }
    ctx.body = reply
  }
  // 消息类型判断
  else if (message.MsgType === 'text') {
    // 获取到内容
    let content = message.Content
    // 默认的回复文案
    let reply = 'Oh,你说的 ' + content + '太复杂了,无法解析'

    if (content === '1') {
      reply = '常峻第一大爱好,高艳琪'
    } else if (content === '2') {
      reply = '常峻第二大爱好,代码'
    } else if (content === '3') {
      reply = '常峻第三大爱好,烫头'
    } else if (content === '常峻') {
      reply = '常峻有三大爱好'
    } else if (content === '4') {
      // 上传零食素材
      let data = await client.handle(
        'uploadMaterial', //上传临时素材方法
        'image', // 图片
        resolve(__dirname, '../2.jpg') // 文件路径
      )
      reply = {
        type: 'image',
        mediaId: data.media_id // 媒体文件上传后，获取标识
      }
    } else if (content === '5') {
      let data = await client.handle(
        'uploadMaterial',
        'video',
        resolve(__dirname, '../1.mp4')
      )
      reply = {
        type: 'video',
        title: '高艳琪',
        description: '我爱你',
        mediaId: data.media_id
      }
    } else if (content === '6') {
      let data = await client.handle(
        'uploadMaterial',
        'video',
        resolve(__dirname, '../6.mp4'),
        {
          type: 'video',
          description: '{"title": "高艳琪呀", "introduction": "我爱你我爱你"}'
        }
      )

      reply = {
        type: 'video',
        title: '高艳琪我爱你 2',
        description: '高艳琪我爱你',
        mediaId: data.media_id
      }
    } else if (content === '7') {
      let data = await client.handle(
        'uploadMaterial',
        'image',
        resolve(__dirname, '../2.jpg'),
        {
          type: 'image'
        }
      )

      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    } else if (content === '8') {
      let data = await client.handle(
        'uploadMaterial',
        'image',
        resolve(__dirname, '../2.jpg'),
        {
          type: 'image'
        }
      )
      let data2 = await client.handle(
        'uploadMaterial',
        'pic',
        resolve(__dirname, '../2.jpg'),
        {
          type: 'image'
        }
      )
      console.log(data2)

      let media = {
        articles: [
          {
            title: '这是服务端上传的图文 1',
            thumb_media_id: data.media_id,
            author: 'Scott',
            digest: '没有摘要',
            show_cover_pic: 1,
            content: '点击去常峻的个人网站',
            content_source_url: 'https://blog.52chinaweb.com/'
          },
          {
            title: '这是服务端上传的图文 2',
            thumb_media_id: data.media_id,
            author: 'Scott',
            digest: '没有摘要',
            show_cover_pic: 1,
            content: '点击去常峻的个人网站',
            content_source_url: 'http://github.com/'
          }
        ]
      }

      let uploadData = await client.handle('uploadMaterial', 'news', media, {})

      let newMedia = {
        media_id: uploadData.media_id,
        index: 0,
        articles: {
          title: '这是服务端上传的图文 1',
          thumb_media_id: data.media_id,
          author: 'Scott',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '点击去常峻的个人网站',
          content_source_url: 'https://blog.52chinaweb.com/'
        }
      }

      console.log(uploadData)

      let mediaData = await client.handle(
        'updateMaterial',
        uploadData.media_id,
        newMedia
      )

      console.log(mediaData)

      let newsData = await client.handle(
        'fetchMaterial',
        uploadData.media_id,
        'news',
        true
      )
      let items = newsData.news_item
      let news = []

      items.forEach(item => {
        news.push({
          title: item.title,
          description: item.description,
          picUrl: data2.url,
          url: item.url
        })
      })

      reply = news
    } else if (content === '9') {
      let counts = await client.handle('countMaterial')
      console.log(JSON.stringify(counts))

      let res = await Promise.all([
        client.handle('batchMaterial', {
          type: 'image',
          offset: 0,
          count: 10
        }),
        client.handle('batchMaterial', {
          type: 'video',
          offset: 0,
          count: 10
        }),
        client.handle('batchMaterial', {
          type: 'voice',
          offset: 0,
          count: 10
        }),
        client.handle('batchMaterial', {
          type: 'news',
          offset: 0,
          count: 10
        })
      ])

      console.log(res)

      reply = `
        image: ${res[0].total_count}
        video: ${res[1].total_count}
        voice: ${res[2].total_count}
        news: ${res[3].total_count}
      `
    } else if (content === '10') {
      // 创建标签
      // let newTag = await client.handle('createTag', 'gaoyanqi2')
      // console.log(newTag)
      // 删除标签
      // await client.handle('delTag', 100)
      // 编辑标签
      // await client.handle('updateTag', 101, 'gaoyanqi4')
      // 批量打标签/取消标签
      // await client.handle('batchTag', [message.FromUserName], 102)
      // // 获取某个标签的用户列表
      // let userList = await client.handle('fetchTagUsers', 102)
      // console.log(userList)
      // // 获取公众号的标签列表
      let tagsData = await client.handle('fetchTags')
      console.log(tagsData)
      // 获取某个用户的标签列表
      // let userTags = await client.handle('getUserTags', message.FromUserName)
      // console.log(userTags)
      reply = tagsData.tags.length
    } else if (content === '11') {
      let userList = await client.handle('fetchUserList')
      console.log(userList)
      reply = userList.total + ' 个关注者'
    } else if (content === '12') {
      await client.handle('remarkUser', message.FromUserName, '小朋友')
      reply = '改名成功'
    } else if (content === '13') {
      let userInfoData = await client.handle(
        'getUserInfo',
        message.FromUserName
      )
      console.log(userInfoData)
      reply = JSON.stringify(userInfoData)
    } else if (content === '14') {
      let batchUsersInfo = await client.handle('fetchBatchUsers', [
        {
          openid: message.FromUserName,
          lang: 'zh_CN'
        },
        {
          openid: 'o8Oa51QaO2lT-_8ZtiMqvGK6WvEs',
          lang: 'zh_CN'
        }
      ])

      console.log(batchUsersInfo)

      reply = JSON.stringify(batchUsersInfo)
    } else if (content === '15') {
      // let tempQrData = {
      //   expire_seconds: 400000, //该二维码有效时间
      //   action_name: 'QR_SCENE',// 二维码类型
      //   action_info: { // 二维码详细信息
      //     scene: {
      //       scene_id: 101 // 场景值ID
      //     }
      //   }
      // }
      // let tempTicketData = await client.handle('createQrcode', tempQrData)
      // console.log(tempTicketData)
      // let tempQr = client.showQrcode(tempTicketData.ticket)
      let qrData = {
        action_name: 'QR_SCENE',
        action_info: {
          scene: {
            scene_id: 99
          }
        }
      }
      let ticketData = await client.handle('createQrcode', qrData)
      console.log(ticketData)
      let qr = client.showQrcode(ticketData.ticket)
      console.log(qr)
      reply = qr
      
    } else if (content === '16') {
      let longurl = 'https://blog.52chinaweb.com/'
      let shortData = await client.handle('createShortUrl', 'long2short', longurl)
      console.log(shortData)
      reply = shortData.short_url
    } else if (content === '17') {
      let semanticData = {
        query: '查一下明天从北京到上海的南航机票',
        city: '北京',
        category: 'flight,hotel',
        uid: message.FromUserName
      }
      let searchData = await client.handle('semantic', semanticData)

      console.log(searchData)

      reply = JSON.stringify(searchData)
    } else if (content === '18') {
      let body = '人生苦短，我用python'
      let aiData = await client.handle('aiTranslate', body, 'zh_CN', 'en_US')

      console.log(aiData)

      reply = JSON.stringify(aiData)
    } 

    // 将要回复的数据挂载到上下文中的body属性中
    ctx.body = reply
  }

  await next()
}
