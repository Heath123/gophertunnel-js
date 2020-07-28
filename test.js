const gophertunnel = require('./gophertunnel.js')

const remoteAddress = '127.0.0.1:3000'

setInterval(function () {
  console.log('test')
}, 3000)

async function test () {
  const listener = gophertunnel.listen('raknet', '0.0.0.0:29132')
  console.log('Started! Accepting connections...')
  const conn = await listener.accept()
  const mcConn = conn.toMinecraftConn()
  const data = mcConn.clientData
  data.ServerAddress = remoteAddress
  console.log('Connection recieved!') // Data:', mcConn.clientData)
  const serverConn = new gophertunnel.Dialer({
    ClientData: data
  }).dial('raknet', remoteAddress)

  console.log(serverConn.gameData)
  mcConn.startGame(serverConn.gameData)
  console.log('after')
}

test()
