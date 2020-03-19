const fs = require('fs')
const $ = require('jquery')

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
        return (Date.now() + Math.random()).toString()
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

module.exports = { tdBasic, tdPage, tdMath }


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