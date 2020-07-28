package main

import "C"

import (
	// "strconv"
	"time"

	"github.com/sandertv/gophertunnel/minecraft"
	"github.com/sandertv/gophertunnel/minecraft/protocol/login"

	// "io/ioutil"
	// "log"
	// "os"
	"encoding/json"
	"fmt"

	// "math"
	// "sort"
	"net"
	"sync"
)

var count int
var mtx sync.Mutex

var stringsToListeners map[string]*minecraft.Listener
var stringsToNetConns map[string]*net.Conn
var stringsToMinecraftConns map[string]*minecraft.Conn
var stringsToDialers map[string]*minecraft.Dialer

var retStringsToValues map[string]interface{}

//export Listen
func Listen(network string, address string) *C.char {
	listener, err := minecraft.Listen(network, address)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	stringsToListeners[fmt.Sprintf("%v", &listener)] = listener
	return C.CString(fmt.Sprintf("%v", &listener))
}

//export ListenerToString
func ListenerToString(pointerString string) *C.char {
	return C.CString(fmt.Sprintf("%v", stringsToListeners[pointerString]))
}

func ListenerAcceptBlocking(pointerString string) /* *C.char */ string {
	conn, err := stringsToListeners[pointerString].Accept()
	if err != nil {
		return /* C.CString( */ "err: " + err.Error() /* ) */
	}
	stringsToNetConns[fmt.Sprintf("%v", &conn)] = &conn
	return /* C.CString( */ fmt.Sprintf("%v", &conn) /* ) */
}

//export ListenerAcceptPromise
func ListenerAcceptPromise(uniqueValue string, pointerString string) {
	go func() {
		newUniqueValue := string([]byte(uniqueValue))
		retStringsToValues[newUniqueValue] = ListenerAcceptBlocking(pointerString)
	}()
}

//export NetConnToString
func NetConnToString(pointerString string) *C.char {
	return C.CString(fmt.Sprintf("%v", *stringsToNetConns[pointerString]))
}

//export NetConnToMinecraftConn
func NetConnToMinecraftConn(pointerString string) *C.char {
	conn, ok := (*stringsToNetConns[pointerString]).(*minecraft.Conn)
	if ok == false {
		return C.CString("err: type assertion failed")
	}
	stringsToMinecraftConns[fmt.Sprintf("%v", &conn)] = conn
	return C.CString(fmt.Sprintf("%v", &conn))
}

//export MinecraftConnToString
func MinecraftConnToString(pointerString string) *C.char {
	return C.CString(fmt.Sprintf("%v", *stringsToMinecraftConns[pointerString]))
}

func MinecraftConnStartGameBlocking(pointerString string, gameDataJson string) *C.char {
	var gameData minecraft.GameData
	err := json.Unmarshal([]byte(gameDataJson), &gameData)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	conn := *stringsToMinecraftConns[pointerString]
	for k, v := range gameData.GameRules {
		val, isFloat64 := v.(float64)
		if isFloat64 {
			converted := float32(val)
			gameData.GameRules[k] = converted
		}
	}
	err = conn.StartGame(gameData)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	return C.CString("")
}

//export MinecraftConnStartGamePromise
func MinecraftConnStartGamePromise(uniqueValue string, pointerString string, gameDataJson string) {
	go func() {
		newUniqueValue := string([]byte(uniqueValue))
		newPointerString := string([]byte(pointerString))
		retStringsToValues[newUniqueValue] = MinecraftConnStartGameBlocking(newPointerString, gameDataJson)
	}()
}

//export MinecraftConnClientData
func MinecraftConnClientData(pointerString string) *C.char {
	conn := *stringsToMinecraftConns[pointerString]
	data := conn.ClientData()
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	return C.CString(string(jsonBytes))
}

//export MinecraftConnGameData
func MinecraftConnGameData(pointerString string) *C.char {
	conn := *stringsToMinecraftConns[pointerString]
	data := conn.GameData()
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	return C.CString(string(jsonBytes))
}

//export CreateDialer
func CreateDialer(options string) *C.char {
	var dialer minecraft.Dialer
	err := json.Unmarshal([]byte(options), &dialer)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	dialer.IdentityData = login.IdentityData{
		// XUID:        "2535448190742031",
		XUID:        "000901FA08C16E0F",
		Identity:    "ee2e9ec9-8ef2-34ac-bcb7-5661e9f97458",
		DisplayName: "OrlaDog",
	}
	stringsToDialers[fmt.Sprintf("%v", &dialer)] = &dialer
	return C.CString(fmt.Sprintf("%v", &dialer))
}

//export DialerDial
func DialerDial(pointerString string, network string, address string) *C.char {
	dialer := stringsToDialers[pointerString]
	serverConn, err := dialer.Dial(network, address)
	if err != nil {
		return C.CString("err: " + err.Error())
	}
	stringsToMinecraftConns[fmt.Sprintf("%v", &serverConn)] = serverConn
	return C.CString(fmt.Sprintf("%v", &serverConn))
}

func Blocking() int {
	fmt.Println("pre-block")
	time.Sleep(1 * time.Second)
	fmt.Println("post-block")
	return 123
}

//export NonBlockingTest
func NonBlockingTest(uniqueValue string) {
	go func() {
		newUniqueValue := string([]byte(uniqueValue))
		retStringsToValues[newUniqueValue] = Blocking()
	}()
}

//export FetchRet
func FetchRet() *C.char {
	res, _ := json.Marshal(retStringsToValues) // TODO: err
	retStringsToValues = make(map[string]interface{})
	return C.CString(string(res))
}

//export Init
func Init() {
	stringsToListeners = make(map[string]*minecraft.Listener)
	stringsToNetConns = make(map[string]*net.Conn)
	stringsToMinecraftConns = make(map[string]*minecraft.Conn)
	stringsToDialers = make(map[string]*minecraft.Dialer)

	retStringsToValues = make(map[string]interface{})
}

func main() {}
