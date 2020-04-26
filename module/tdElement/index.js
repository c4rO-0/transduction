const fs = require('fs')
const Store = require('electron-store');
const path = require('path')
const mkdirp = require('mkdirp')

const { tdBasic, tdBasicPage } = require('tdBasic')
const { tdOS } = require('tdSys')

/**
 * 用来统一管理List
 * 比如 extList, downloadList等
 * list本质是object
 */
class tdList {

    constructor(pathInStore = undefined, storeIn = undefined) {
        this.list = {}
        this.pathInStore = pathInStore
        if (storeIn) {
            this.store = storeIn
        } else {
            this.store = new Store()
        }

        // console.log(this.pathInStore, this.store)
    }
    addListFromSub(subList) {
        this.list = { ...this.list, ...subList }
    }
    addListFromEle(key, element) {
        this.list[key] = element
    }
    deleteEleByKey(key) {
        delete this.list[key]
    }
    deleteEleByIndex(index) {
        delete this.list[Object.keys(this.list)[index]];
    }
    hasEle(key) {
        return this.list.hasOwnProperty(key)
    }
    getLen() {
        return (Object.keys(this.list)).length
    }
    getList() {
        return this.list
    }
    getKeys() {
        return Object.keys(this.getList())
    }
    getValues() {
        return Object.values(this.getList())
    }
    getValueByKey(key) {
        return this.list[key]
    }
    getSubByKeys(...keys) {
        let subList = new tdList()
        keys.forEach(key => {
            subList.addListFromEle(key, this.list[key])
        })
        return subList
    }
    getValueByIndex(index) {
        return this.list[Object.keys(this.list)[index]]
    }
    updateEleValue(key, value) {
        this.list[key] = value
    }
    print(commit = undefined) {
        if (commit) {
            console.log(commit)
        }
        console.log(this.list)
    }
    toJSONList(funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {
        let pList
        for (let key in this.list) {
            pList[key] = funToJSON(this.list[key])
        }
        return pList
    }
    fromJSONList(pList, funFromJSON = (obj) => {
        return obj
    }) {
        for (let key in pList) {
            this.list[key] = funFromJSON(pList[key])
        }
    }
    getPathInStore() {
        return this.pathInStore
    }
    hasPathInSore() {
        return !(this.pathInStore === undefined
            || this.pathInStore === '')
    }
    setPathInStore(pathInStore) {
        this.pathInStore = pathInStore
        if (!this.hasPathInSore()) {
            throw ('illegal path : ', pathInStore);
        }
    }
    getListInSore(funFromObj = (obj) => {
        return obj
    }) {
        if (this.store.has(this.pathInStore)) {
            this.fromJSONList(this.store.get(this.pathInStore), funFromObj)
        } else {
            console.error('no ', this.pathInStore, ' in store.')
        }

    }
    saveListInStore(override = true, funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {
        if (override) {
            this.store.set(this.pathInStore, this.toJSONList(funToJSON))
        } else {
            if (!this.store.has(this.pathInStore)) {
                this.store.set(this.pathInStore, this.toJSONList(funToJSON))
            }
        }
    }
    saveEleInStore(key, override = true, funToJSON = (obj) => {
        return JSON.parse(JSON.stringify(obj))
    }) {
        if (!(key in this.list)) {
            return
        }

        if (override) {
            this.store.set(this.pathInStore + '.' + key, funToJSON(this.list[key]))
        } else {
            if (!this.store.has(this.pathInStore + '.' + key)) {
                this.store.set(this.pathInStore + '.' + key, funToJSON(this.list[key]))
            }
        }
    }
    resetListInStore() {
        if (this.hasPathInSore()) {
            this.store.reset(this.pathInStore)
        }

    }
    deleteListInStore() {
        if (this.hasPathInSore()) {
            this.store.delete(this.pathInStore)
        }
    }
    hasListInStore() {
        return (this.hasPathInSore() && this.store.has(this.pathInStore))
    }
}


// class tdConvo {
//     //---------------------
//     action // 最近一次动作
//     userID // convoID, 也是userID
//     nickName // 显示的昵称
//     time // 最新一条消息时间
//     avatar // 头像地址
//     message // 最新一条消息
//     counter // 未读消息数
//     index // 在所属app中的Index
//     muted // 是否静音
//     isActInTd // 在transduction里是否为显示状态
//     appTag // 所属appTag
//     isBundle // 该convo是否捆绑了其他convo, 如果是appTag应该为'td'
//     bundleList // 捆绑的其他app convo列表, bundleList = undefined , if isBundle == false

//     // ----function-----
//     // print()
//     // update({key:value})
//     // clone(old)
//     // active()
//     //---------------------


//     print() {
//         console.log("=====output Convo======")
//         console.log("Name :", this.nickName)
//         console.log("ID : ", this.userID)
//         console.log("avatar : ", this.avatar)
//         console.log("index :", this.index)
//         console.log("message :", this.message)
//         console.log("time :", this.time)
//         console.log("counter :", this.counter)
//         console.log("action :", this.action)
//         console.log("muted :", this.muted)
//     }

// }
class tdConvo {
    constructor(webTag, action, userID, nickName, time, avatar, message, counter, index, muted) {
        this.webTag = webTag
        this.action = action
        this.userID = userID
        this.nickName = nickName

        // time为str
        if (time === undefined) {
            this.time = time
        } else if (typeof (time) === 'number') {
            this.time = (new Date(time)).toTimeString().slice(0, 5)
        } else if (typeof (time) == "string") {
            this.time = time
        } else {
            console.log("error : tdConvo :  wrong type of time : ", typeof (time), time)
            this.time = new Date()
        }

        this.avatar = avatar
        this.message = message

        if (counter === undefined) {
            this.counter = counter
        } else if (typeof (counter) == "number") {
            this.counter = counter
        } else if (typeof (counter) == "string") {
            this.counter = parseInt(counter)
        } else {
            console.log("error : tdConvo :  unknown counter type : ", typeof (counter), counter)
            this.counter = undefined
        }

        if (index === undefined) {
            this.index = index
        } else if (typeof (index) == "number") {
            this.index = index
        } else if (typeof (index) == "string") {
            this.index = parseInt(index)
        } else {
            console.log("error : tdConvo :  unknown index type : ", typeof (index), index)
            this.index = undefined
        }

        if (muted === undefined) {
            this.muted = muted
        } else if (typeof (muted) == "boolean") {
            this.muted = muted
        } else if (typeof (muted) == "string") {
            if (muted.toLowerCase == "false") {
                this.muted = false
            } else if (muted.toLowerCase == "true") {
                this.muted = true
            } else {
                console.log("error : tdConvo :  unknown muted value : ", muted)
                this.muted = undefined
            }

        } else {
            console.log("error : tdConvo :  unknown muted type : ", typeof (muted), muted)
            this.muted = undefined
        }

    }

    print() {
        console.log("debug : ", "Name :", this.nickName)
        console.log("debug : ", "ID : ", this.userID)
        console.log("debug : ", "avatar : ", this.avatar)
        console.log("debug : ", "index :", this.index)
        console.log("debug : ", "message :", this.message)
        console.log("debug : ", "time :", this.time)
        console.log("debug : ", "counter :", this.counter)
        console.log("debug : ", "action :", this.action)
        console.log("debug : ", "muted :", this.muted)
    }
}



class tdBubble {

    constructor(msgID,
        time = undefined,
        status = undefined,
        type = undefined,
        from = undefined,
        avatar = undefined,
        message = undefined,
        fileName = undefined,
        fileSize = undefined,
        oldMsgID = undefined) {

        this.msgID = msgID

        // time
        if (time) {
            this.time = time
        } else {
            this.time = new Date()
        }

        this.status = status

        // type  'text' 'img' 'url' 'file' 'unknown' undefined
        this.type = type

        this.from = from

        this.avatar = avatar

        this.fileName = fileName

        this.fileSize = fileSize

        this.message = message

        this.oldMsgID = oldMsgID

    }

    static genFromDialog(dialog) {

        return new tdBubble(
            dialog['msgID'],
            tdBasic.timeAny2Obj(dialog["time"]),
            dialog["status"],
            dialog['type'],
            dialog["from"],
            dialog["avatar"],
            dialog['message'],
            dialog['fileName'],
            dialog['fileSize'],
            dialog['oldMsgID'])
    }

}

class tdDownloadItem {

    static rootPathInStore = 'donwloadList'

    constructor(msgID, webTag, userID, type = undefined, url = undefined, savePath = undefined, 
        progress = undefined, totalBytes = undefined, receivedBytes = undefined, startTime = undefined, speed = undefined, leftTime = undefined) {
        this.url = url
        this.unicode = tdBasic.uniqueStr()
        this.webTag = webTag
        this.userID = userID
        this.msgID = msgID
        this.type = type
        this.savePath = savePath
        this.progress = progress
        this.totalBytes = totalBytes
        this.receivedBytes = receivedBytes
        this.startTime = startTime
        this.speed = speed
        this.leftTime = leftTime
    }

    static fromObj(obj) {
        let val = new tdDownloadItem(
            obj.msgID,
            obj.webTag,
            obj.userID,
            obj.type,
            obj.url,
            obj.savePath
        )

        Object.assign(val, obj)

        // if (obj.unicode !== undefined) {
        //     val.unicode = obj.unicode
        // }
        return val
    }

    static fromJSON(json) {
        // console.log("obj from json ", json)
        return tdDownloadItem.fromObj(json)
    }

    toObj() {
        return {
            'url': this.url,
            'unicode': this.unicode,
            'webTag': this.webTag,
            'userID': this.userID,
            'msgID': this.msgID,
            'type': this.type,
            'savePath': this.savePath
        }
    }

    isSame(webTag, userID, msgID) {
        if (this.webTag == webTag &&
            this.userID == userID &&
            this.msgID == msgID
        ) {
            return true
        } else {
            return false
        }
    }
}



class tdFileSend {
    constructor(name, path, webkitRelativePath, fileID = '', type=undefined, size=undefined, dataUrl = undefined) {
        this.name = name
        this.path = path
        this.webkitRelativePath = webkitRelativePath
        this.size = size
        this.type = type
        this.fileID = fileID
        this.dataUrl = dataUrl
    }
    static fromFile(file) {


        return new tdFileSend(file.name, file.path, file.webkitRelativePath,'', file.type, file.size)
 
    }

    updateFromFile(file) {

        this.name = file.name
        this.path = file.path
        this.webkitRelativePath = file.webkitRelativePath
        this.size = file.size
        this.type = file.type    

    }

    isImg(){
        return this.type.match('^image/') !== null
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

            var tempDir = tdOS.getTmpdir()

            var uploadedImagePath = path.join(
                tempDir,
                'transduction', 'fileSend', this.fileID,
                this.name);

            
            this.pathRoot = path.join(
                tempDir,
                'transduction', 'fileSend')

            let prePath = this.path
            this.path = uploadedImagePath

            if(this.isImg()){
                var base64Data = this.dataUrl;

                var imageBuffer = decodeBase64Image(base64Data);
                this.dataUrl = ''
    
                // Save decoded binary image to disk
                try {
                    mkdirp(path.dirname(uploadedImagePath), (errMK) => {
                        if (errMK) {
                            throw (errMK)
                        }
                        fs.writeFile(uploadedImagePath, imageBuffer.data,
                            function (errWriteFile) {
                                if (errWriteFile) throw errWriteFile;

                                // console.log('DEBUG : Saved image to :', uploadedImagePath);

                                resolve()
                            });
    
                    })
    
                }
                catch (error) {
                    console.error('ERROR:', error);
                    reject('error : localSave')
                }
            }else{
                try {
                    mkdirp(path.dirname(uploadedImagePath), (errMK) => {
                        if (errMK) {
                            throw (errMK)
                        }
                        fs.copyFile(prePath, uploadedImagePath, (errCopy) => {
                            if (errCopy) throw errCopy;
                            // console.log('DEBUG : Saved file to :', uploadedImagePath);
                            
                            resolve()
                          });
    
                    })
    
                }
                catch (error) {
                    console.error('ERROR:', error);
                    reject('error : localSave')
                }
            }

            // }
        })

    }
    clear() {
        tdOS.removeDir(path.join(this.pathRoot, this.fileID))
    }
}


class tdSettings {

    static rootPathInStore = 'tdSettings'
    static store = new Store()

    /**
     * 获取全部设置
     * @returns 返回全部设置的值
     */
    static getAllSettings() {

        return tdSettings.store.get(tdSettings.rootPathInStore, undefined)
    }

    /**
     * 获取指定项设置
     * @param {string} property 指定的设置项
     * @returns 返回指定设置的值
     */
    static getSettings(property) {

        return tdSettings.store.get(tdSettings.rootPathInStore + '.' + property, undefined)

    }

    /**
     * 重置设置
     * @param {*} value 值
     */
    static resetSettings(value = undefined) {
        tdSettings.store.set(tdSettings.rootPathInStore, value)
    }

    /**
     * 设置指定设置项
     * @param {string} property 指定的设置项
     * @param {*} value 值
     * @param {boolean} reset 如果存在是否覆盖, 默认不覆盖
     */
    static setSettings(property, value, reset = false) {

        let path = tdSettings.rootPathInStore + '.' + property
        if (!tdSettings.store.has(path) || reset) {
            tdSettings.store.set(path, value)
        }
    }
}




/**
 * input草稿
 * 以字典的形式储存字符串
 * ["webtag+ID":"content"]
 */
class tdInput {
    constructor(webTag = undefined, userID = undefined, draftHTML = undefined) {

        this.webTag = webTag
        this.userID = userID

        if (webTag && userID) {
            this.key = tdInput.genKey(webTag, userID)
        } else {
            this.key = undefined
        }
        this.draftHTML = draftHTML
    }
    static genKey(webTag, userID) {
        return webTag + '-' + userID
    }

    getKey() {
        return this.key
    }
    getDraftHTML() {
        return this.draftHTML
    }


    /**
     * 去掉input html中的tag
     * getInput函数调用该函数 
     * @param {tdList} fileList 待发送的文件列表
     * @param {String} HTML 
     * @returns {Array} 数组只包含string和File, 并按照input中顺序排列
     */
    static simpleInput(fileList, HTML) {
        let arrayHTML = jQuery.parseHTML(HTML);

        let sendStr = new Array()

        $.each(arrayHTML, function (i, el) {
            // console.log(el)
            if ($(el)[0].nodeName == '#text') {
                sendStr.push($(el).text())
            } else if ($(el)[0].nodeName == 'IMG') {
                let fileID = $(el).attr('data-file-ID')
                // let dataUrl = $(el).attr('data-file-id')
                sendStr.push(fileList.getValueByKey(fileID))
                // sendStr.push(dataUrl)
            } else {
                sendStr = sendStr.concat(tdInput.simpleInput(fileList, $(el).html()))
            }
        })

        return sendStr
    }

    /**
     * 从给定的html中直接拿到sending
     * @param {tdList} fileList 待发送的文件列表
     * @param {String} innerHTML 
     * @returns {Array} 以数组形式储存, 只含有string和File. 
     */
    static getInputFromHtml(fileList, innerHTML) {
        let arrayInput = tdInput.simpleInput(fileList, innerHTML)
        let arraySimpleInput = new Array()


        let fileIndex = -1
        let strInput = ''
        arrayInput.forEach((value, index) => {
            // console.log(index, typeof (value), '----')
            // console.log(value)
            if (typeof (value) != 'string') {
                strInput = arrayInput.slice(fileIndex + 1, index).join('\n')
                if (strInput.length > 0) arraySimpleInput.push(strInput)

                arraySimpleInput.push(value)
                fileIndex = index
            }
        })

        strInput = arrayInput.slice(fileIndex + 1).join('\n')
        if (strInput.length > 0) arraySimpleInput.push(strInput)

        return arraySimpleInput
    }
}



module.exports = {  tdList, tdConvo, tdBubble, tdDownloadItem, tdFileSend, tdSettings, tdInput }