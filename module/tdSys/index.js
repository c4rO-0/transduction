/**
 * variable td need
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp')


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
        this.name = file.name
        this.path = file.path
        this.webkitRelativePath = file.webkitRelativePath
        this.size = file.size
        this.type = file.type    
    }

    updateFromFile(file) {

        this.name = file.name
        this.path = file.path
        this.webkitRelativePath = file.webkitRelativePath
        this.size = file.size
        this.type = file.type    

    }

    isImg(){
        return this.type.match('^image/')
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

            var tempDir = os.tmpdir();

            var uploadedImagePath = path.join(
                tempDir,
                'transduction', 'fileSend', this.fileID,
                this.name);

            
            this.pathRoot = path.join(
                tempDir,
                'transduction', 'fileSend')

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
                            function () {
                                console.log('DEBUG : Saved image to :', uploadedImagePath);
                                this.path = uploadedImagePath
                                resolve('')
                            });
    
                    })
    
                }
                catch (error) {
                    console.log('ERROR:', error);
                    reject('error : localSave')
                }
            }else{
                try {
                    mkdirp(path.dirname(uploadedImagePath), (errMK) => {
                        if (errMK) {
                            throw (errMK)
                        }
                        fs.copyFile(this.path, uploadedImagePath, (errCopy) => {
                            if (errCopy) throw errCopy;
                            console.log('DEBUG : Saved file to :', uploadedImagePath);
                            this.path = uploadedImagePath
                            resolve('')
                          });
    
                    })
    
                }
                catch (error) {
                    console.log('ERROR:', error);
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

}

module.exports = { tdFileSend, tdOS }