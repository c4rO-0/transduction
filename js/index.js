const td = require('td')
const Store = require('electron-store');
const store = new Store();

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

    
    $('#openDevTools').on('click', ()=>{
        td.tdMessage.sendToMain({ "openDevTools": "" })
    })

    $(document).on('click', '[devtool]', (e)=>{
        let webTag = $(e.target).closest('div[exttag]').attr('exttag')
        if(! td.tdAPI.openDevtool( webTag )){
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
<label >'+ ext.name + '</label>'+ ( (td.tdAPI.isDebugOn && ext.status) ? ' <button devTool>devTool</button>' : '' )
+'</div>')
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


    $('#td-convo-container').on('click', 'div.td-convo', function () {

    })



})


// td.tdAPI.extList.print()