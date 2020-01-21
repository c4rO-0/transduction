/**
 * variable td need
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')
const events = require('events')

class tdFileSend {
    constructor(name, path, webkitRelativePath, fileID = '', dataUrl = undefined) {
        this.name = name
        this.path = path
        this.webkitRelativePath = webkitRelativePath
        // this.size = size
        // this.type = type
        this.fileID = fileID
        this.dataUrl = dataUrl
    }
    convertFile(file) {
        this.name = file.name
        this.path = file.path
        this.webkitRelativePath = file.webkitRelativePath
        // this.size = file.size
        // this.type = file.type    

    }
    addFileID(fileID) {
        this.fileID = fileID
    }
    addDataUrl(dataUrl) {
        this.dataUrl = dataUrl
    }
    print() {
        console.log('------output File property--------')
        console.log(this)
    }
    localSave() {
        // if (this.path == "") {

        return new Promise((resolve, reject) => {
            function decodeBase64Image(dataString) {
                var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                var response = {};

                if (matches.length !== 3) {
                    return new Error('Invalid input string');
                }

                response.type = matches[1];
                response.data = Buffer.from(matches[2], 'base64');

                return response;
            }

            // Regular expression for image type:
            // This regular image extracts the "jpeg" from "image/jpeg"
            var imageExpression = /\/(.*?)$/;

            var base64Data = this.dataUrl;

            var imageBuffer = decodeBase64Image(base64Data);
            var tempDir = os.tmpdir();

            // This variable is actually an array which has 5 values,
            // The [1] value is the real image extension
            var imageTypeDetected = imageBuffer
                .type
                .match(imageExpression);

            var uploadedImagePath = path.join(
                tempDir,
                'transduction', 'img', this.fileID,
                this.name);

            this.path = uploadedImagePath
            this.pathRoot = path.join(
                tempDir,
                'transduction', 'img')
            this.dataUrl = ''

            // Save decoded binary image to disk
            try {
                mkdirp(path.dirname(uploadedImagePath), (errMK) => {
                    if (errMK) {
                        throw (errMK)
                    }
                    fs.writeFile(uploadedImagePath, imageBuffer.data,
                        function () {
                            console.log('DEBUG : Saved image to :', uploadedImagePath);
                            resolve('')
                        });

                })

            }
            catch (error) {
                console.log('ERROR:', error);
                reject('error : localSave')
            }

            // }
        })

    }
    clear() {
        tdOS.removeDir(path.join(this.pathRoot, this.fileID))
    }
}

/**
 * all things about operating system
 */
class tdOS {
    constructor() {

    }
    static strUserAgentWin = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
AppleWebKit/537.36 (KHTML, like Gecko) \
Chrome/73.0.3683.121 Safari/537.36"
    static strUserAgentLinux = "Mozilla/5.0 (X11; Linux x86_64) \
AppleWebKit/537.36 (KHTML, like Gecko) \
Chrome/73.0.3683.121 Safari/537.36"
    /**
     * 删除系统某个文件夹及其子文件
     * @param {string} dir 绝对路径
     */
    static removeDir(dir) {
        if (!path.isAbsolute(dir)) {
            return
        }

        let files = fs.readdirSync(dir)
        for (var i = 0; i < files.length; i++) {
            let childPath = path.join(dir, files[i]);
            let stat = fs.statSync(childPath)
            if (stat.isDirectory()) {
                // 递归
                removeDir(childPath);
            } else {
                //删除文件
                fs.unlinkSync(childPath);
            }
        }
        fs.rmdirSync(dir)
    }

}

class tdConvo {
    //---------------------
    action // 最近一次动作
    userID // convoID, 也是userID
    nickName // 显示的昵称
    time // 最新一条消息时间
    avatar // 头像地址
    message // 最新一条消息
    counter // 未读消息数
    index // 在所属app中的Index
    muted // 是否静音
    isActInTd // 在transduction里是否为显示状态
    appTag // 所属appTag
    isBundle // 该convo是否捆绑了其他convo, 如果是appTag应该为'td'
    bundleList // 捆绑的其他app convo列表, bundleList = undefined , if isBundle == false

    // ----function-----
    // print()
    // update({key:value})
    // clone(old)
    // active()
    //---------------------


    print() {
        console.log("=====output Convo======")
        console.log("Name :", this.nickName)
        console.log("ID : ", this.userID)
        console.log("avatar : ", this.avatar)
        console.log("index :", this.index)
        console.log("message :", this.message)
        console.log("time :", this.time)
        console.log("counter :", this.counter)
        console.log("action :", this.action)
        console.log("muted :", this.muted)
    }

}

class tdBubble {
    constructor() {
        this.bTextL = ''
        this.bTextR = ''
        this.bUrlL = ''
        this.bUrlR = ''
        this.bUnknownL = ''
        this.bUnknownR = ''
        this.bFSendL = ''
        this.bFSendR = ''
        this.bFileL = ''
        this.bFileR = ''
        this.bImgL = ''
        this.bImgR = ''
    }

    initialize() {

        this.bTextL = $('div[msgid="bTextL"]').clone()
        this.bTextR = $('div[msgid="bTextR"]').clone()

        this.bUrlL = $('div[msgid="bUrlL"]').clone()
        this.bUrlR = $('div[msgid="bUrlR"]').clone()

        this.bUnknownL = $('div[msgid="bUnknownL"]').clone()
        this.bUnknownR = $('div[msgid="bUnknownR"]').clone()

        this.bFSendL = $('div[msgid="bFSendL"]').clone()
        this.bFSendL = $('div[msgid="bFSendR"]').clone()

        this.bFileL = $('div[msgid="bFileL"]').clone()
        this.bFileR = $('div[msgid="bFileR"]').clone()

        this.bImgL = $('div[msgid="bImgL"]').clone()
        this.bImgR = $('div[msgid="bImgR"]').clone()
    }

    createBubble(dialog) {

        let cUser = $('div.td-chat-title').attr('data-user-i-d')
        let cwebTag = $('div.td-chat-title').attr('data-app-name')

        let timeObj = undefined

        if (typeof (dialog["time"]) === 'number') {
            timeObj = new Date(dialog["time"])
        } else if (typeof (dialog["time"]) == "string") {
            timeObj = new Date(dialog["time"])
        } else if (typeof (dialog["time"]) == "object") {
            timeObj = dialog["time"]
        } else {
            timeObj = new Date()
        }
        let time = timeObj.toTimeString().slice(0, 5)

        let bubble
        if (dialog['type'] == 'text') {

            if (dialog["from"]) {
                bubble = $(this.bTextL).clone()
            } else {
                bubble = $(this.bTextR).clone()
            }

            $(bubble).find('div.td-chatText').text(dialog['message'])

        } else if (dialog['type'] == 'img') {

            if (dialog["from"]) {
                bubble = $(this.bImgL).clone()
            } else {
                bubble = $(this.bImgR).clone()
            }

            $(bubble).find('div.td-chatImg img').attr('src', dialog['message'])

        } else if (dialog['type'] == 'url') {


            if (dialog['message'].search('https://send.firefox.com/download') !== -1) {
                if (dialog["from"]) {
                    bubble = $(this.bFSendL).clone()
                } else {
                    bubble = $(this.bFSendR).clone()
                }
            } else {
                if (dialog["from"]) {
                    bubble = $(this.bUrlL).clone()
                } else {
                    bubble = $(this.bUrlR).clone()
                }
            }

            $(bubble).find('div.td-chatText a').attr('href', dialog['message'])
            $(bubble).find('div.td-chatText a').text(dialog['message'])

        } else if (dialog['type'] == 'file') {
            if (dialog["from"]) {
                bubble = $(this.bFileL).clone()
            } else {
                bubble = $(this.bFileR).clone()
            }
            $(bubble).find('div.td-chatText > div > div > p').text("File Name: " + dialog['fileName'])
            let sizeStr
            if (dialog['fileSize'] < 1024.) {
                sizeStr = dialog['fileSize'].toFixed().toString() + ' B'
            } else if (dialog['fileSize'] < 1024. ** 2) {
                sizeStr = (dialog['fileSize'] / 1024.).toFixed(1).toString() + ' KB'
            } else if (dialog['fileSize'] < 1024. ** 3) {
                sizeStr = (dialog['fileSize'] / 1024. ** 2).toFixed(1).toString() + ' MB'
            } else if (dialog['fileSize'] < 1024. ** 4) {
                sizeStr = (dialog['fileSize'] / 1024. ** 3).toFixed(1).toString() + ' GB'
            } else {
                sizeStr = (dialog['fileSize'] / 1024. ** 4).toFixed(1).toString() + ' TB'
            }

            $(bubble).find('div.td-chatText > div > div > div > p').text("Size: " + sizeStr)
            $(bubble).find('div.td-chatText button[download]').attr('href', dialog['message'])

            // 查看 是否已经下载
            // console.log('cwebTag:',cwebTag, 'cUser:',cUser)
            for (let index = 0; index < donwloadList.length; index++) {
                // console.log('index:',donwloadList[index])
                if (donwloadList[index].webTag == cwebTag
                    && donwloadList[index].userID == cUser
                    && donwloadList[index].msgID == dialog.msgID) {

                    $(bubble).addClass('td-downloaded')

                    $(bubble).find('button[open]').attr('path', donwloadList[index].savePath)

                    break
                }
            }



        } else if (dialog['type'] == 'unknown') {
            if (dialog["from"]) {
                bubble = $(this.bUnknownL).clone()
            } else {
                bubble = $(this.bUnknownR).clone()
            }
            $(bubble).find('div.td-chatText > p').text(dialog['message'])

        } else {
            if (dialog["from"]) {
                bubble = $(this.bUnknownL).clone()
            } else {
                bubble = $(this.bUnknownR).clone()
            }
            $(bubble).find('div.td-chatText > p').text(dialog['message'])
        }

        if (dialog["from"]) {
            let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
            let appName = $("#td-right div.td-chat-title").attr("data-app-name")
            let avatarUrl = dialog["avatar"] === undefined ?
                $("#td-left \
            div.td-convo[data-user-i-d='" + userID + "'][data-app-name='" + appName + "'] \
            div.td-avatar").css('background-image').slice(5, -2)
                : dialog["avatar"]

            $(bubble).find("div.td-chatAvatar img").attr('src', avatarUrl)

            $(bubble).find('> p.m-0').text(dialog["from"])
            $(bubble).find('div.td-them p.m-0').text(time)

        } else {
            $(bubble).find('p.m-0').text(time)

            if (dialog["status"] == "done") {

            } else if (dialog["status"] == "sending") {
                $(bubble).find('.td-bubbleStatus').removeClass('td-none')
            } else if (dialog["status"] == "failed") {
                $(bubble).find('.td-bubbleStatus').removeClass('td-none')
                $(bubble).find('.td-bubbleStatus').addClass('bubbleError')
            }
        }


        $(bubble).attr('msgTime', timeObj.getTime())
        $(bubble).attr('msgid', dialog['msgID'])

        // console.log("create bubble from : ", dialog)

        return $(bubble)[0].outerHTML

    }
}

class tdExt {

    dir
    path
    webTag


    /**
    * path of configure.json
    * @param {String} pathConfig  绝对路径
    * @returns {Promise} config 
    */
   loadExtConfigure(pathConfig) {

            console.log("load extension config ...")

            return new Promise((resolve, reject) => {

                fs.readFile(pathConfig, (err, rawConfig) => {

                    if (err) {
                        // 文件不存在, 或者 
                        if (err.code === 'ENOENT') {
                            console.error('no configure found in ', pathConfig)
                        } else if (err.code === 'EISDIR') {
                            console.error('configure path \' ', pathConfig, '\' is a directory')
                        } else {
                            console.error('configure read failed', pathConfig)
                        }

                        reject(err)
                        return
                    } else {
                        let config = JSON.parse(rawConfig)
                        config.dir = path.dirname(pathConfig)
                        config.path = pathConfig
                        config.webTag = config.name + "-" + config.unicode

                        // 必须含有name
                        if (config.name === undefined
                            || config.name === "") {
                            reject("load extension error , no name found in ", pathConfig)
                            return
                        }

                        // 必须含有type
                        if (config.type !== 'app' && config.type !== 'tool') {
                            reject("load extension error , unknown type in ", pathConfig)
                            return
                        }

                        // 必须含有unicode
                        if (config.unicode === undefined && config.unicode === "") {
                            reject("load extension error , no unicode in ", pathConfig)
                            return
                        }

                        try {
                            // icon是必需的
                            if (!fs.existsSync(path.join(config.dir, config.icon.any))) {
                                reject("load extension error , no logo found in ", config.icon.any)
                                return
                            }
                        } catch (err) {
                            console.error(err)
                            reject("load extension error , no logo found in ", config.icon.any)
                            return
                        }

                        resolve(config)


                    }

                });

            })

        }

    static install() {

    }
    static remove() {

    }
}

/**
 * index.js 后台处理的函数大概都在这
 */
class tdAPI {

    /**
     * 函数构想
     * - 获取所有Convo
     * - 获取激活的Convo
     * - 获取激活Convo对应的Bubble列表
     * - 切换激活的Convo
     * - 发送消息?
     * - 获取设置
     * - 更改设置
     * - 下载列表
     */

    static fileSendList
    static donwloadList
    static convoList
    static bubbleList

    /**
     * event list
     * ready : 初始化完毕
     * 
     * ext-install
     * ext-remove
     * 
     * convo-new : 从webview接收到新的Convo
     * convo-update : convoList有更新
     * convo-active : convo被激活
     * 
     * bubble-new :
     * bubble-update :
     * 
     * 
     */
    static event

    static initialize() {

        // set event
        this.event = new events.EventEmitter();


        // initial variable
        this.fileSendList = undefined
        this.donwloadList = undefined
        this.convoList = undefined
        this.bubbleList = undefined
    }
    /**
     * 更新convoList
     * @param {tdConvo} convo 
     */
    static updateConvoList(convo) {

    }



}
/**
 * 相应配套渲染UI的函数在这
 */
class tdUI {


}

module.exports = { tdFileSend, tdOS }