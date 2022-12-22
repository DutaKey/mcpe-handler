const { ping } = require('bedrock-protocol')
ping({ host: 'play.rpla.my.id', port: 19132 }).then(res => {
  console.log(res)
})