const td = require('td')
const Store = require('electron-store');
const path = require('path');
const { nativeImage, dialog, shell, session } = require('electron').remote


$(document).ready(() => {

    console.log(td.tdOS.tdRootPath())

    td.tdAPI.initialize()


    /**
     * app icon clicked
     */
    $(document).on('click', '.td-app-status img[class]', function () {
        let webTag = this.id.substring(4)

        let webTagSelector = '#modal-' + webTag
        $(td.tdUI.webTag2Selector(this.id.substring(4))).width("-webkit-fill-available")
        $(td.tdUI.webTag2Selector(this.id.substring(4))).height("-webkit-fill-available")

        if (this.matches('.app-offline')) {
            $(webTagSelector).modal('show')
        }
        if (this.matches('.app-online')) {
            $(webTagSelector + '>div.modal-dialog').addClass('modal-xl')
            $(webTagSelector).modal('show')
        }

        // 打开webview app, 取消静音
        $(td.tdUI.webTag2Selector(webTag)).get(0).setAudioMuted(false)


    })

    $('div.td-toolbox').on('click', '.theme-transduction', (e) => {

        if (e.target.id === 'tool-goBackChat') {
            // 返回聊天窗口
            $('.td-toolbox > img').removeClass('theme-transduction-active')

            $(td.tdUI.chatLogSelector).show()
            // webview隐藏, 防止再次点击刷新页面
            $(td.tdUI.toolboxSelector + " webview").each(function (index) {
                $(this).hide();
            });
            $(td.tdUI.toolboxSelector).hide()
        } else {
            $('.td-toolbox > img').removeClass('theme-transduction-active')
            $(e.target).addClass('theme-transduction-active')
            let toolTagName = e.target.id.substring(5)
            $(td.tdUI.chatLogSelector).hide()
            $(td.tdUI.toolboxSelector).show()

            td.tdAPI.extList.getValueByKey(toolTagName).loadTool()

        }
    })


    $('#openDevTools').on('click', () => {
        td.tdMessage.sendToMain({ "openDevTools": "" })
    })

    $(document).on('click', '[devtool]', (e) => {
        let webTag = $(e.target).closest('div[exttag]').attr('exttag')
        if (!td.tdAPI.openDevtool(webTag)) {
            console.error('open Devtool failed, because no webview with tag : ', webTag)
        }
    })

    $(document).on('show.bs.modal', '.modal', function (e) {
        $(this).css('left', '')
    })

    $(document).on('hidden.bs.modal', '.modal', function (e) {
        if (!this.matches('#modal-image') && !this.matches('#modal-settings')) {
            $('>div.modal-dialog', this).removeClass('modal-xl')
            // 关闭webview app重新静音
            $(td.tdUI.webTag2Selector(this.id.substring(6))).get(0).setAudioMuted(true)
        }
        // $('#modal-wechat > div.modal-dialog').css('left', '')
        $(this).css('left', '100000px')
        $(this).show()

        $(td.tdUI.webTag2Selector(this.id.substring(6))).width("800px")
        $(td.tdUI.webTag2Selector(this.id.substring(6))).height("800px")
    })
    $('#modal-image').on('hidden.bs.modal', function (e) {
        angle = 0
        $(".modal-body > img", this).css({ "transform": "rotate(0deg)" })
    })

    $('#modal-settings').on('show.bs.modal', function (e) {


        // 加载 ext
        $('div[extTag]').remove()
        // load extList
        $.each(td.tdAPI.extList.getList(), (webTag, ext) => {
            // console.log(' ', webTag,' | ', details.status , debug, (debug && details.status) )
            $("#modal-settings .modal-body").append(
                '<div extTag="' + webTag + '">\
<input type="checkbox" ' + (ext.status ? 'checked="checked"' : '') + '>\
<label >'+ ext.name + '</label>' + ((td.tdAPI.isDebugOn && ext.status) ? ' <button devTool>devTool</button>' : '')
                + '</div>')
        })
    })

    // ext被点击
    $('#modal-settings').on('click', 'div[extTag] input', function (e) {

        let webTag = $(e.target).parent('div[extTag]').attr('extTag')
        let ext = td.tdAPI.extList.getValueByKey(webTag)
        if (e.target.checked) {
            ext.installExt()
        } else {
            ext.removeExt()
        }
    })

    // convo被点击
    $('#td-convo-container').on('click', 'div.td-convo', function () {


        // 识别webtag
        let cWebTag = $("div.td-chat-title").attr("data-app-name")
        let cUserID = $("div.td-chat-title").attr("data-user-i-d")
        let webTag = $(this).attr("data-app-name")
        let userID = $(this).attr("data-user-i-d")
        let nickName = $(this).find("div.td-nickname").text()

        if (webTag == undefined || userID == undefined) {
            console.log("error : click obj error.")
            console.log("obj : ", this)
            console.log("userID : ", userID)
            return
        }

        $('#td-convo-container div.td-convo').removeClass('theme-transduction-active')
        $(this).addClass('theme-transduction-active')

        // 读取和临时储存草稿
        //去掉focus, focus在向后台发送查询后再添加
        $(td.tdUI.inputboxSelector).blur()
        // 记录
        if (cWebTag != undefined && cUserID != undefined) {


            let draft = new td.tdInput(cWebTag, cUserID, td.tdUI.getInputHTML())

            td.tdAPI.inputList.addListFromEle(
                draft.getKey(),
                draft
            )
        }
        // 读取
        let inputHtml
        let key = td.tdInput.genKey(webTag, userID)
        if (td.tdAPI.inputList.hasEle(key)) {
            inputHtml = td.tdAPI.inputList.getValueByKey(key).getDraftHTML()
        } else {
            inputHtml = ''
        }
        td.tdUI.resetInput(inputHtml)


        // 加载dialog(当前可能显示的是tool)
        $(td.tdUI.goBackSelector).click()
        // 滑动条拖到最后
        $(td.tdUI.chatLogSelector).scrollTop($(td.tdUI.chatLogSelector)[0].scrollHeight)

        if (
            $("#td-right div.td-chat-title").attr("data-user-i-d") == userID
            && $("#td-right div.td-chat-title").attr("data-app-name") == webTag
            && $("#td-right div.td-chat-title h2").text() == nickName
        ) {
            // 当前聊天内容不需要清空, 只需要补充
            td.tdMessage.HostSendToWeb(
                td.tdUI.webTag2Selector(webTag),
                { "queryDialog": { "userID": userID } }
            ).then((res) => {
                console.log("queryDialog : webReply : ", res)
                $(td.tdUI.inputboxSelector).focus()
                td.tdPage.setEndOfContenteditable($(td.tdUI.inputboxSelector).get(0))
            }).catch((error) => {
                $(td.tdUI.inputboxSelector).focus()
                td.tdPage.setEndOfContenteditable($(td.tdUI.inputboxSelector).get(0))
                throw error
            })

        } else {
            // ---------右侧标题-----------
            $("#td-right div.td-chat-title").attr("data-user-i-d", userID)
            $("#td-right div.td-chat-title").attr("data-app-name", webTag)
            $("#td-right div.td-chat-title h2").text(nickName)
            let ext = td.tdAPI.extList.getValueByKey(webTag)
            $("#td-right div.td-chat-title img").attr('src',
                path.join(
                    ext.dir, ext.icon.any
                )
            )
            $(td.tdUI.chatLogSelector).empty()

            td.tdMessage.HostSendToWeb(
                td.tdUI.webTag2Selector(webTag),
                { "queryDialog": { "userID": userID } }
            ).then((res) => {
                console.log("queryDialog : webReply : ", res)

                $(td.tdUI.inputboxSelector).focus()
                td.tdPage.setEndOfContenteditable($(td.tdUI.inputboxSelector).get(0))

            }).catch((error) => {
                $(td.tdUI.inputboxSelector).focus()

                $(td.tdUI.inputboxSelector).get(0).setSelectionRange(
                    $(td.tdUI.inputboxSelector).html().length,
                    $(td.tdUI.inputboxSelector).html().length)

                td.tdPage.setEndOfContenteditable(
                    $(td.tdUI.inputboxSelector).get(0)
                )

                throw error

            })
        }

    })

    
    // 下载
    $(document).on('click', '[download]', function (event) {
        // console.log('download : ', this)
        let type = undefined
        let msgID = undefined
        if (event.target.nodeName == 'IMG') {
            type = 'img'
            msgID = event.target.msgId
        } else {
            type = 'file'
            msgID = $(this).closest('div.td-bubble').attr('msgid')

            $(this).closest('div.td-bubble').addClass('td-downloading')
        }

        let downloadItem = new td.tdDownloadItem(msgID, 
            $("div.td-chat-title").attr('data-app-name'),   //webTag
            $("div.td-chat-title").attr('data-user-i-d'),   //userID
            type,                                           // type
            $(this).attr('href')                            // url
            )

        td.tdMessage.sendToMain({'download':downloadItem.toObj()})
            .then((saveInfo) => {
                console.log("download complete , info : ", saveInfo.download)
                if (type == 'img') {

                } else {
                    $(this).closest('div.td-bubble').removeClass('td-downloading')

                    $(this).closest('div.td-bubble').addClass('td-downloaded')

                    $(this).closest('div.td-bubble').find('button[open]').attr('path', saveInfo.download.savePath)

                }
                // 储存 donloadList
                downloadItem = td.tdDownloadItem.fromObj(saveInfo.download)

                td.tdAPI.donwloadList.addListFromEle(downloadItem.unicode,downloadItem)

                td.tdAPI.donwloadList.saveEleInStore(downloadItem.unicode)

            })

    });

    // open directory
    $(document).on('click', '[open]', function (event) {
        console.log("show item : ", $(this).closest('div.td-bubble button[open]').attr('path'),
            shell.showItemInFolder($(this).closest('div.td-bubble button[open]').attr('path')))
    })


    $(document).on('contextmenu', (evt) => {
        let target = $(evt.target).closest('div.td-convo')
        let yOffset = 0
        if (target.length) {
            /**
             * 画线，删线
             */
            if (target.hasClass('selected')) {
                target.toggleClass('selected')
                target.data('line').remove()
            } else {
                $('#td-mix').css('opacity', '1')
                target.toggleClass('selected')
                target.data('line', new LeaderLine(target[0], document.getElementById('td-mix'), { dropShadow: true, startPlug: 'disc', endPlug: 'disc', path: 'fluid' }))
            }
            /**
             * 算convo高度的平均值，作为按钮的位置
             */
            $('div.td-convo.selected').each(function (index, element) {
                yOffset -= yOffset / (index + 1)
                yOffset += $(element).position().top / (index + 1)
            })
            /**
             * 如果没有选中，按钮消失
             */
            $('#td-mix').css('transform', 'translateY(' + yOffset + 'px)')
            if($('div.td-convo.selected').length === 0){
                $('#td-mix').css('opacity', '0')
            }
        }
    })

    /**
     * 更新线位置
     */
    $('#td-mix').on('transitionend', ()=>{
        $('div.td-convo.selected').each(function(){
            $(this).data('line').position()
        })
    })

    $('#td-pin').draggable({
        grid: [10, 10],
        containment: "#td-pin-area",
        drag: td.tdUI.followPin,
        stop: function (event, ui) {
            td.tdUI.followPin()
            let target = document.getElementById('td-pin')
            let y = target.getBoundingClientRect().bottom
            target.style.bottom = window.innerHeight - y + 'px'
            target.style.top = ''
        },
    })
    td.tdUI.followPin()

    document.getElementById('swTray').addEventListener('click', function () {
        // store.set('tdSettings.swTray', this.checked)
        td.tdSettings.setSettings('swTray', this.checked, true)
    })


    // ===========================发送消息===========================
    $(td.tdUI.sendSelector).on('click', event => {
        console.log("send click")
        let cWebTag = $("div.td-chat-title").attr("data-app-name")
        let cUserID = $("div.td-chat-title").attr("data-user-i-d")

        let draft = new td.tdInput(cWebTag, cUserID, td.tdUI.getInputHTML())

        draft.send().then((res)=>{
            // console.log("send done : ", res)
            td.tdUI.resetInput()
        }).catch(err=>{
            console.log("send failed : ", err)
        })
        
    })

    // ======================拖入东西==========================
    //--------------------------------------
    // 在bubble区域检测到拖入
    $('#td-right').on('dragenter', (event) => {
        // $('.td-dropFile').show()
        $('.td-dropFile').removeClass('hide')
    })

    //--------------------------------------
    // 在input检测到拖入
    $('div.td-inputbox').on('dragenter', (event) => {
        $('.td-dropFile').removeClass('hide')
    })

    //--------------------------------------
    // 离开拖入区
    $('.td-dropFile').on('dragleave', (event) => {
        $('.td-dropFile').addClass('hide')
    })

    //--------------------------------------
    // 拖入并松手
    $('.td-dropFile').on('drop', (event) => {
        // console.log('drop')
        $('.td-dropFile').addClass('hide')
        event.preventDefault();

        td.tdUI.processDataTransfer(event.originalEvent.dataTransfer).then(() => {

            $(".td-inputbox").focus()

            td.tdMessage.sendToMain({ "focus": "" })

            console.log("insert input done")
        })
    })


    //--------------------------------------
    // 粘贴
    $("div.td-inputbox").on("paste", function (event) {
        event.preventDefault();
        // event.stopPropagation();

        let clipData = event.originalEvent.clipboardData || window.clipboardData;
        td.tdUI.processDataTransfer(clipData).then(() => {
            $(".td-inputbox").focus()
            console.log("paste insert input done")
        })

    });

    //--------------------------------------
    // 通过按钮添加文件
    $(td.tdUI.imgButtonSelector).on('click', event => {
        $('.td-toolbox > input[type="file"]').get(0).click()
    })

    $('.td-toolbox > input[type="file"]').on("change", function (event) {
        td.tdUI.processFileList(event.target.files).then(() => {
            $(".td-inputbox").focus()
            console.log("insert input done")
        })
    });


})


// td.tdAPI.extList.print()