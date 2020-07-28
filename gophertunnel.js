// var ref = require('ref-napi')
var ffi = require('ffi-napi')
var Struct = require('ref-struct-napi')

/* var ArrayType = require('ref-array-napi')
var LongArray = ArrayType(ref.types.longlong)
var GoSlice = Struct({
  data: LongArray,
  len: 'longlong',
  cap: 'longlong'
}) */
var GoString = Struct({
  string: 'string',
  length: 'longlong'
})
const gophertunnelWrapper = ffi.Library('./goWrapper/test.so', {
  Listen: ['string', [GoString, GoString]],
  Init: ['void', []],
  ListenerToString: ['string', [GoString]],
  ListenerAcceptPromise: ['string', [GoString, GoString]],
  NetConnToString: ['string', [GoString]],
  NetConnToMinecraftConn: ['string', [GoString]],
  MinecraftConnToString: ['string', [GoString]],
  MinecraftConnClientData: ['string', [GoString]],
  MinecraftConnStartGamePromise: ['string', [GoString, GoString, GoString]],
  MinecraftConnGameData: ['string', [GoString]],
  CreateDialer: ['string', [GoString]],
  DialerDial: ['string', [GoString, GoString, GoString]],
  NonBlockingTest: ['void', [GoString]],
  FetchRet: ['string', []]
})

let uniqueValue = 0
let valuesToPromiseResolves = {}

class Listener {
  constructor (listenerPointerString) {
    this.listenerPointerString = listenerPointerString
  }

  toString () {
    return gophertunnelWrapper.ListenerToString(goStr(this.listenerPointerString))
  }

  accept () { // TODO: Error handling
    console.log(JSON.stringify(uniqueValue.toString()))
    gophertunnelWrapper.ListenerAcceptPromise(goStr(uniqueValue.toString()), goStr(this.listenerPointerString))
    return new Promise(function(resolve, reject) {
      valuesToPromiseResolves[uniqueValue.toString()] = resolve
      console.log(valuesToPromiseResolves)
      uniqueValue += 1
    })
    /*
    const ret = gophertunnelWrapper.ListenerAccept()
    if (ret.startsWith('err: ')) {
      const error = ret.slice(5, ret.length)
      throw error
    }
    const conn = new NetConn(ret)
    return conn
    */
  }
}

class NetConn {
  constructor (netConnPointerString) {
    console.log('CONSTRUCT:', netConnPointerString)
    this.netConnPointerString = netConnPointerString
  }

  toString () {
    return gophertunnelWrapper.NetConnToString(goStr(this.netConnPointerString))
  }

  toMinecraftConn () {
    const ret = gophertunnelWrapper.NetConnToMinecraftConn(goStr(this.netConnPointerString))
    if (ret.startsWith('err: ')) {
      const error = ret.slice(5, ret.length)
      throw error
    }
    const conn = new MinecraftConn(ret)
    return conn
  }
}

class MinecraftConn {
  constructor (minecraftConnPointerString) {
    this.minecraftConnPointerString = minecraftConnPointerString
  }

  toString () {
    return gophertunnelWrapper.MinecraftConnToString(goStr(this.minecraftConnPointerString))
  }

  startGame (gameData) { // TODO: err
    console.log(JSON.stringify(uniqueValue.toString()))
    gophertunnelWrapper.MinecraftConnStartGamePromise(goStr(uniqueValue.toString()), goStr(this.minecraftConnPointerString), goStr(JSON.stringify(gameData)))
    return new Promise(function(resolve, reject) {
      valuesToPromiseResolves[uniqueValue.toString()] = resolve
      console.log(valuesToPromiseResolves)
      uniqueValue += 1
    })
  }

  get clientData () {
    const ret = gophertunnelWrapper.MinecraftConnClientData(goStr(this.minecraftConnPointerString))
    if (ret.startsWith('err: ')) {
      const error = ret.slice(5, ret.length)
      throw error
    }
    const data = JSON.parse(ret)
    return data
  }

  get gameData () {
    const ret = gophertunnelWrapper.MinecraftConnGameData(goStr(this.minecraftConnPointerString))
    if (ret.startsWith('err: ')) {
      const error = ret.slice(5, ret.length)
      throw error
    }
    const data = JSON.parse(ret)
    return data
  }
}

class Dialer {
  constructor (options) {
    const ret = gophertunnelWrapper.CreateDialer(goStr(JSON.stringify(options)))
    if (ret.startsWith('err: ')) {
      const error = ret.slice(5, ret.length)
      throw error
    }
    this.dialerPointerString = ret
  }

  dial (network, address) {
    const ret = gophertunnelWrapper.DialerDial(goStr(this.dialerPointerString), goStr(network), goStr(address))
    if (ret.startsWith('err: ')) {
      const error = ret.slice(5, ret.length)
      throw error
    }
    return new MinecraftConn(ret)
  }
}

exports.Dialer = Dialer

gophertunnelWrapper.Init()

function goStr (string) {
  const str = new GoString()
  str.string = string
  str.length = string.length
  return str
}

/*
str = new GoString()
string = 'Hello Node!';
console.log(string.length)
str.p = string
str.n = string.length
awesome.Log(str)
*/

exports.listen = function (network, address) {
  const ret = gophertunnelWrapper.Listen(goStr(network), goStr(address))
  if (ret.startsWith('err: ')) {
    const error = ret.slice(5, ret.length)
    throw error
  }
  const listener = new Listener(ret)
  return listener
  // gophertunnelWrapper.ListenerTest(goStr(ret))
}

setInterval(function() {
  const res = JSON.parse(gophertunnelWrapper.FetchRet())
  if (Object.keys(res).length === 0 && res.constructor === Object) return
  console.log(Object.keys(res).length, res.constructor, res)
  valuesToPromiseResolves[Object.keys(res)[0]](
    new NetConn(res[Object.keys(res)[0]])
  )
}, 10)

exports.nonBlockingTest = function () {
  return new Promise(function(resolve, reject) {
    console.log(JSON.stringify(uniqueValue.toString()))
    gophertunnelWrapper.NonBlockingTest(goStr(uniqueValue.toString()))
    valuesToPromiseResolves[uniqueValue.toString()] = resolve
    console.log(valuesToPromiseResolves)
    uniqueValue += 1
  })
}