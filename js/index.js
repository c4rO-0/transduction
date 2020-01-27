const td = require('td')

$(document).ready(() => {

    td.tdAPI.initialize()

    // on
    /**
     * webview出现
     */
    $(document).on('click', '.td-app-status img[class]', function () {
        let webTag = this.id.substring(4)

        let webTagSelector = '#modal-' + webTag
        $(td.tdPage.webTag2Selector(this.id.substring(4))).width("-webkit-fill-available")
        $(td.tdPage.webTag2Selector(this.id.substring(4))).height("-webkit-fill-available")

        if (this.matches('.app-offline')) {
            $(webTagSelector).modal('show')
        }
        if (this.matches('.app-online')) {
            $(webTagSelector + '>div.modal-dialog').addClass('modal-xl')
            $(webTagSelector).modal('show')
        }

        // 打开webview app, 取消静音
        $(td.tdPage.webTag2Selector(webTag)).get(0).setAudioMuted(false)


    })

    $('div.td-toolbox').on('click', '.theme-transduction', (e) => {

        if (e.target.id === 'tool-goBackChat') {
            // 返回聊天窗口
            $('.td-toolbox > img').removeClass('theme-transduction-active')

            $("#td-right div.td-chatLog[winType='chatLog']").show()
            // webview隐藏, 防止再次点击刷新页面
            $("#td-right div.td-chatLog[winType='tool'] webview").each(function (index) {
                $(this).hide();
            });
            $("#td-right div.td-chatLog[winType='tool']").hide()
        } else {
            $('.td-toolbox > img').removeClass('theme-transduction-active')
            $(e.target).addClass('theme-transduction-active')
            let toolTagName = e.target.id.substring(5)
            $("#td-right div.td-chatLog[winType='chatLog']").hide()
            $("#td-right div.td-chatLog[winType='tool']").show()

            loadTool("#td-right div.td-chatLog[winType='tool']", toolTagName, extList[toolTagName].webview.url, extList[toolTagName].webview.script)
        }
    })

    
    $('#openDevTools').on('click', ()=>{
        td.tdMessage.sendToMain({ "openDevTools": "" })
    })

    $(document).on('click', '[devtool]', (e)=>{
        let webTag = $(e.target).closest('div[exttag]').attr('exttag')
        if(! openDevtool( webTag )){
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
            $(td.tdPage.webTag2Selector(this.id.substring(6))).get(0).setAudioMuted(true)
        }
        // $('#modal-wechat > div.modal-dialog').css('left', '')
        $(this).css('left', '100000px')
        $(this).show()

        $(td.tdPage.webTag2Selector(this.id.substring(6))).width("800px")
        $(td.tdPage.webTag2Selector(this.id.substring(6))).height("800px")
    })
    $('#modal-image').on('hidden.bs.modal', function (e) {
        angle = 0
        $(".modal-body > img", this).css({ "transform": "rotate(0deg)" })
    })

    $('#modal-settings').on('show.bs.modal', function (e) {


        // 加载 ext
        $('div[extTag]').remove()

        // load extList
        if (store.has('tdSettings.extList')) {
            let extListStore = store.get('tdSettings.extList')
            $.each(extListStore, (webTag, details) => {
                // console.log(' ', webTag,' | ', details.status , debug, (debug && details.status) )
                $("#modal-settings .modal-body").append(
                    '<div extTag="' + webTag + '">\
<input type="checkbox" ' + (details.status ? 'checked="checked"' : '') + '>\
<label >'+ details.name + '</label>'+ ( (debug && details.status) ? ' <button devTool>devTool</button>' : '' )
+'</div>')
            })
        }
    })

    // ext被点击
    $('#modal-settings').on('click', 'div[extTag] input', function (e) {

        let webTag = $(e.target).parent('div[extTag]').attr('extTag')
        let configPath = store.get("tdSettings.extList." + webTag).configPath
        if (e.target.checked) {
            installExt(configPath)
        } else {
            uninstallExt(configPath)
        }
    })


    $('#td-convo-container').on('click', 'div.td-convo', function () {

    })



})


// td.tdAPI.extList.print()