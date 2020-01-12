/**
 * basic functions
 */


/**
 * 返回一个以时间作为种子的唯一字符串.
 * 目前被用在消息传递的时候创建一个独一无二的channel
 * @returns {String} UniqueStr 
 */
function UniqueStr() {

    return (Date.now() + Math.random()).toString()
}

strUserAgentWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
AppleWebKit/537.36 (KHTML, like Gecko) \
Chrome/73.0.3683.121 Safari/537.36", 
    strUserAgentLinux: "Mozilla/5.0 (X11; Linux x86_64) \
AppleWebKit/537.36 (KHTML, like Gecko) \
Chrome/73.0.3683.121 Safari/537.36", 