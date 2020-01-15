/**
 * variable td need
 */

const fs = require('fs')
const {tdBasic} = require('tdBasic')


class fileSend {
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
        tdBasic.removeDir(path.join(this.pathRoot, this.fileID))
    }
}

module.exports = {fileSend}