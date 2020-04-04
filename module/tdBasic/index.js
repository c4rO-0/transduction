const fs = require('fs')
const $ = require('jquery')
const Store = require('electron-store');

/**
 * basic functions
 */
class tdBasic {
    constructor() {

    }

    /**
     * 返回一个以时间作为种子的唯一字符串.
     * 目前被用在消息传递的时候创建一个独一无二的channel
     * @returns {String} uniqueStr 
     */
    static uniqueStr() {
        return ( Math.round((Date.now() + Math.random())*1000) ).toString()
    }

    static timeAny2Obj(timeAny){
        let timeObj = undefined

        if (typeof (timeAny) === 'number') {
            timeObj = new Date(timeAny)
        } else if (typeof (timeAny) == "string") {
            timeObj = new Date(timeAny)
        } else if (typeof (timeAny) == "object") {
            timeObj = timeAny
        } else {
            timeObj = new Date()
        }

        return timeObj
    }
    static timeObj2Str(timeObj){
        return timeObj.toTimeString().slice(0, 5)
    }

    static size2Str(size){
        let sizeStr
        if (size < 1024.) {
            sizeStr = size.toFixed().toString() + ' B'
        } else if (size < 1024. ** 2) {
            sizeStr = (size / 1024.).toFixed(1).toString() + ' KB'
        } else if (size < 1024. ** 3) {
            sizeStr = (size / 1024. ** 2).toFixed(1).toString() + ' MB'
        } else if (size < 1024. ** 4) {
            sizeStr = (size / 1024. ** 3).toFixed(1).toString() + ' GB'
        } else {
            sizeStr = (size / 1024. ** 4).toFixed(1).toString() + ' TB'
        }
        return sizeStr
    }

    static getFileNameFromUrl(url) {
        return url.split('/').pop().split('#')[0].split('?')[0];
    }

}

class tdPage {
    constructor() {

    }

    /**
     * HTML encode
     * @param {String} str 
     * @returns encode HTML
     */
    static htmlEntities(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    /**
     * A utility function that detects and handles AJAXed content. 
     * @author BrockA
     * @see {@link https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js  }
     * @param {String} selectorTxt 
     * The jQuery selector string that specifies the desired element(s).
     * @param {Function} actionFunction 
     * The code to run when elements are found. It is passed a jNode to the matched element.
     * @param {Boolean} [bWaitOnce]
     * If false, will continue to scan for new elements even after the first match is found.
     * @param {String} [iframeSelector]
     * If set, identifies the iframe to search.
     */
    static waitForKeyElements(
        selectorTxt,    /* Required: The jQuery selector string that
                    specifies the desired element(s).
                */
        actionFunction, /* Required: The code to run when elements are
                    found. It is passed a jNode to the matched
                    element.
                */
        bWaitOnce,      /* Optional: If false, will continue to scan for
                    new elements even after the first match is
                    found.
                */
        iframeSelector  /* Optional: If set, identifies the iframe to
                    search.
                */
    ) {

        waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector)

    }

    /**
     * 在页面插入<p id=electronReady>来标记页面已经加载好.
     * 可以通过该手段在页面发生跳转后重新执行脚本.
     */
    static insertReady() {
        if ($('#electronReady') == null || $('#electronReady').length == 0) {
            $("body").append("<p id='electronReady' style='visibility:hidden;'> electronReady </p>")
        }
    }

    /**
     * 在webview页面插入一段JS代码.
     * @param {String} IDwebview 
     * 要插入webview对应tag的ID
     * @param {String} pathJS 
     * 要插入的脚本存放的路径. 该处为绝对路径.
     */
    static webviewDynamicInsertJS(IDwebview, pathJS) {

        let elementWebview = document.getElementById(IDwebview)

        console.log(elementWebview)
        // 发现URL变化
        elementWebview.addEventListener('did-navigate-in-page', (event) => {
            console.log(IDwebview, "url change : ", event.isMainFrame, event.url)

            // 注入指定脚本
            var script = fs.readFileSync(pathJS, 'utf8')
            script = script.replace(/\\/g, '\\\\');
            script = script.replace(/'/g, '\\\'');
            script = script.replace(/"/g, '\\\"');
            script = script.replace(/\n/g, '\\n');
            script = script.replace(/\r/g, '\\r');
            script = script.replace(/\t/g, '\\t');
            // script = script.replace(/\b/g, '\\b');   
            script = script.replace(/\f/g, '\\f');

            elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
var el = document.createElement('script'); \
el.id='webviewJS';\
el.innerHTML = '"+ script + "';\
document.body.appendChild(el);}")
        })
        // 等待页面加载完成
        elementWebview.addEventListener('dom-ready', () => {
            console.log(IDwebview, "dom-ready")
            // 注入指定脚本
            var script = fs.readFileSync(pathJS, 'utf8')
            script = script.replace(/\\/g, '\\\\');
            script = script.replace(/'/g, '\\\'');
            script = script.replace(/"/g, '\\\"');
            script = script.replace(/\n/g, '\\n');
            script = script.replace(/\r/g, '\\r');
            script = script.replace(/\t/g, '\\t');
            // script = script.replace(/\b/g, '\\b');   
            script = script.replace(/\f/g, '\\f');
            elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
var el = document.createElement('script'); \
el.id='webviewJS';\
el.innerHTML = '"+ script + "';\
document.body.appendChild(el);}")
        })

    }

    
    /**
     * 光标移动到最后
     * https://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
     * @param {*} contentEditableElement 
     */
    static setEndOfContenteditable(contentEditableElement) {
        var range, selection;
        if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);//make the range you have just created the visible selection
        }
        else if (document.selection)//IE 8 and lower
        {
            range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
    }
}

class tdMath {
    constructor() {

    }
    /**
     * 转化位置到周期范围内
     * @param {Int} index 非周期位置(可以是负数), 0代表开始位置
     * @param {Int} length 周期长度
     * @returns {Int} 0-(length-1)
     */
    static periodicPos(index, length) {
        // console.log("periodicPos : ", index, length, index%length, (index%length) + length, ((index%length) + length)%length)
        return ((index % length) + length) % length
    }
}



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


// ====================================================
// local functions and variables
// ====================================================

/**
 * A utility function that detects and handles AJAXed content. 
 * @author BrockA
 * @see {@link https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js  }
 * @param {String} selectorTxt 
 * The jQuery selector string that specifies the desired element(s).
 * @param {Function} actionFunction 
 * The code to run when elements are found. It is passed a jNode to the matched element.
 * @param {Boolean} [bWaitOnce]
 * If false, will continue to scan for new elements even after the first match is found.
 * @param {String} [iframeSelector]
 * If set, identifies the iframe to search.
 */
function waitForKeyElements(
    selectorTxt,    /* Required: The jQuery selector string that
                    specifies the desired element(s).
                */
    actionFunction, /* Required: The code to run when elements are
                    found. It is passed a jNode to the matched
                    element.
                */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                    new elements even after the first match is
                    found.
                */
    iframeSelector  /* Optional: If set, identifies the iframe to
                    search.
                */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes = $(selectorTxt);
    else
        targetNodes = $(iframeSelector).contents()
            .find(selectorTxt);

    if (targetNodes && targetNodes.length > 0) {
        btargetsFound = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each(function () {
            var jThis = $(this);
            var alreadyFound = jThis.data('alreadyFound') || false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound = actionFunction(jThis);
                if (cancelFound)
                    btargetsFound = false;
                else
                    jThis.data('alreadyFound', true);
            }
        });
    }
    else {
        btargetsFound = false;
    }


    //--- Get the timer-control variable for this selector.
    var controlObj = waitForKeyElements.controlObj || {};
    var controlKey = selectorTxt.replace(/[^\w]/g, "_");
    var timeControl = controlObj[controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound && bWaitOnce && timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval(timeControl);
        delete controlObj[controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if (!timeControl) {
            timeControl = setInterval(function () {
                waitForKeyElements(selectorTxt,
                    actionFunction,
                    bWaitOnce,
                    iframeSelector
                );
            },
                300
            );
            controlObj[controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj = controlObj;
}


module.exports = { tdBasic, tdPage, tdMath, tdList, tdConvo }