/**
 * variable td need
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')


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

    static tdRootPath(){

        try {
            return require('electron').remote.app.getAppPath()
        } catch (error) {
            return require('electron').app.getAppPath()
        }
        
    }

    static getTmpdir(){
        return os.tmpdir()
    }

}

module.exports = { tdOS }