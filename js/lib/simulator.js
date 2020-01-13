/**
 * the functions about the simulation of mouse, keyboards will be defined here
 * also includes user's operations.
 * all about chrome debugger
 */
class Simulator {

    constructor() {

    }

    /**
     * chrome debugger for mouse : https://chromedevtools.github.io/devtools-protocol/1-2/Input 
     * e.g. : keypressSimulator('webview[data-app-name="skype"]','keypress',0x41)
     * @param {string} webSelector 'webview[data-app-name="skype"]'
     * @param {string} type nousedown, mouseup, click
     */
    mouseSimulator(webSelector, type, x, y) {


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


    attachInputFile(webSelector, inputSelector, filePath) {

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

}

// export multi
module.exports = [Simulator];