const fs = require('fs')

/**
 * basic functions
 */
class tdBasic {
    constructor() {

    }
    strUserAgentWin = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
    AppleWebKit/537.36 (KHTML, like Gecko) \
    Chrome/73.0.3683.121 Safari/537.36"
    strUserAgentLinux = "Mozilla/5.0 (X11; Linux x86_64) \
    AppleWebKit/537.36 (KHTML, like Gecko) \
    Chrome/73.0.3683.121 Safari/537.36"
    /**
     * 返回一个以时间作为种子的唯一字符串.
     * 目前被用在消息传递的时候创建一个独一无二的channel
     * @returns {String} uniqueStr 
     */
    static uniqueStr() {
        return (Date.now() + Math.random()).toString()
    }
        /**
     * 删除系统某个文件夹及其子文件
     * @param {string} dir 绝对路径
     */
    static removeDir(dir) {
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

module.exports = {tdBasic}
