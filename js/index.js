const td = require('td')
const Store = require('electron-store');
const store = new Store();
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
        $(td.tdUI.inputboxSeletor).blur()
        // 记录
        let inputHtml = $(td.tdUI.inputboxSeletor).html()
        if (cWebTag != undefined && cUserID != undefined) {
            let key = td.tdDraft.genKey(cWebTag, cUserID)
            td.tdAPI.draftList.addListFromEle(
                key,
                new td.tdDraft(key, inputHtml)
            )
        }
        // 读取
        let key = td.tdDraft.genKey(webTag, userID)
        if (td.tdAPI.draftList.hasEle(key)) {
            inputHtml = td.tdAPI.draftList.getValueByKey(key).getContent()
        } else {
            inputHtml = ''
        }
        $(td.tdUI.inputboxSeletor).empty()
        $(td.tdUI.inputboxSeletor).append(inputHtml)


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
                $(td.tdUI.inputboxSeletor).focus()
                td.tdPage.setEndOfContenteditable($(td.tdUI.inputboxSeletor).get(0))
            }).catch((error) => {
                $(td.tdUI.inputboxSeletor).focus()
                td.tdPage.setEndOfContenteditable($(td.tdUI.inputboxSeletor).get(0))
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

                $(td.tdUI.inputboxSeletor).focus()
                td.tdPage.setEndOfContenteditable($(td.tdUI.inputboxSeletor).get(0))

            }).catch((error) => {
                $(td.tdUI.inputboxSeletor).focus()

                $(td.tdUI.inputboxSeletor).get(0).setSelectionRange(
                    $(td.tdUI.inputboxSeletor).html().length,
                    $(td.tdUI.inputboxSeletor).html().length)

                td.tdPage.setEndOfContenteditable(
                    $(td.tdUI.inputboxSeletor).get(0)
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

})


// td.tdAPI.extList.print()