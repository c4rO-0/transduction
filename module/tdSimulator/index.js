/**
 * the functions about the simulation of mouse, keyboards will be defined here
 * also includes user's operations.
 * all about chrome debugger
 */
class tdSimulator {

    constructor() {

    }

    /**
     * chrome debugger for mouse : https://chromedevtools.github.io/devtools-protocol/1-2/Input 
     * e.g. : keypressSimulator('webview[data-app-name="skype"]','keypress',0x41)
     * @param {string} webSelector 'webview[data-app-name="skype"]'
     * @param {string} type nousedown, mouseup, click
     */
    static mouseSimulator(webSelector, type, x, y) {


        let wc = $(webSelector).get(0).getWebContents();

        // console.log("---attachInputFile----")
        try {
            if (!wc.debugger.isAttached()) {
                wc.debugger.attach("1.2");
            }
        } catch (err) {
            console.error("Debugger attach failed : ", err);
        };

        switch (type) {
            case 'click':

                wc.debugger
                    .sendCommand("Input.dispatchMouseEvent", {
                        type: 'mousePressed',
                        x: x,
                        y: y,
                        button: "left",
                        clickCount: 1
                    })

                wc.debugger
                    .sendCommand("Input.dispatchMouseEvent", {
                        type: 'mouseReleased',
                        x: x,
                        y: y,
                        button: "left",
                        clickCount: 1
                    })


                break;
            default:
                throw new Error("Unknown type of event.");
                break;
        }


    }


    static attachInputFile(webSelector, inputSelector, filePath) {

        let wc = $(webSelector).get(0).getWebContents();

        // wc.executeJavaScript('$("'+inputSelector+'").get(0).click(); console.log("click from index");', true);

        // setTimeout(() => {
        console.log("---attachInputFile----")
        try {
            if (!wc.debugger.isAttached()) {
                wc.debugger.attach("1.2");
            }
        } catch (err) {
            console.error("Debugger attach failed : ", err);
        };


        wc.debugger.sendCommand("DOM.getDocument", {}, function (err, res) {
            wc.debugger.sendCommand("DOM.querySelector", {
                nodeId: res.root.nodeId,
                selector: inputSelector  // CSS selector of input[type=file] element                                        
            }, function (err, res) {
                if (res) { // 防止不存在inputSelector
                    wc.debugger.sendCommand("DOM.setFileInputFiles", {
                        nodeId: res.nodeId,
                        files: [filePath]  // Actual list of paths                                                        
                    }, function (err, res) {

                        wc.debugger.detach();
                    });
                } else {
                    console.log("error : attachInputFile : inputSelector : '", inputSelector, "' not exist.")
                }
            });

        });
        // }, 3000);

    }


    /**
     * chrome debugger for key : https://chromedevtools.github.io/devtools-protocol/1-2/Input 
     * e.g. : keypressSimulator('webview[data-app-name="skype"]','keypress',0x41)
     * @param {string} webSelector 'webview[data-app-name="skype"]'
     * @param {string} type keyup, keydown, keypress
     * @param {int} charCode windowsVirtualKeyCode(目前只对字母好使) code列表 https://docs.microsoft.com/en-us/windows/desktop/inputdev/virtual-key-codes
     * @param {boolean} [shift=false] 
     * @param {boolean} [alt=false] 
     * @param {boolean} [ctrl=false]  
     * @param {boolean} [cmd=false]  
     */
    static keypressSimulator(webSelector, type, charCode, shift = false, alt = false, ctrl = false, cmd = false) {


        let wc = $(webSelector).get(0).getWebContents();

        // console.log("---attachInputFile----")
        try {
            if (!wc.debugger.isAttached()) {
                wc.debugger.attach("1.2");
            }
        } catch (err) {
            console.error("Debugger attach failed : ", err);
        };
        var text = "";

        switch (type) {
            case 'keyup':
                type = 'keyUp';
                break;
            case 'keydown':
                type = 'rawKeyDown';
                break;
            case 'keypress':
                type = 'char';
                text = String.fromCharCode(charCode);
                break;
            default:
                throw new Error("Unknown type of event.");
                break;
        }

        var modifiers = 0;
        if (shift) {
            modifiers += 8;
        }
        if (alt) {
            modifiers += 1;
        }
        if (ctrl) {
            modifiers += 2;
        }
        if (cmd) {
            modifiers += 4;
        }

        return wc.debugger
            .sendCommand("Input.dispatchKeyEvent", {
                type: type,
                windowsVirtualKeyCode: charCode,
                modifiers: modifiers,
                text: text
            });

    }

}

// export multi
module.exports = {tdSimulator};
