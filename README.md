# transduction

---

## 开发说明(preload)

为实现transduction的通用性, trabsduction提供两个模块给开发者进行开发.

- chat app 添加对新聊天应用的支持
- 3rd-app 对网页工具的支持

## chat app preload

### 结构 

``` javascript
window.onload = function (){
    const core = require("../js/core.js") 
    
    // 代码开始
    // ....
    // ----------
    // 如果左侧有新消息
    core.WebToHost({
        "Convo-new": convoContent
    }).then((res) => {
        // Host返回的消息
    }).catch((error) => {
        throw error
    }); 
    
    // 接收Host指令
    core.WebReply((key, arg) => {
        return new Promise((resolve, reject) => {
            if (key == 'queryDialog') {
                // 获取用户右侧消息, ID为arg.userID 
                // let ID = arg.userID 
                // ....
                // 将消息发送到前台
				core.WebToHost({ "Dialog": MSGList }).then((res) => {
                    console.log(res)
                }).catch((error) => {
                    throw error
                });
                
            } 
        })
    }
    
}
```

### `core.WebToHost(Obj)`

向前台发送消息. 调用形式为

```javascript
core.WebToHost({key:content}) 
```

只有特定类型的key前台会进行处理. 

#### "Convo-new"

发送左侧新消息提醒. content为Obj

``` javascript
"Convo-new": convoContent
```

##### convoContent

``` javascript
{   // convoContent
            
            // Str | 用户ID | 用来区分用户, 需要具有唯一性
            "userID": userID, 
            
            // str | 此消息动作类型 | 共有三种 : "a","r","c"  
            // a:add 
            //   第一次向前台(transduction)发送该用户的convo, 前台将会渲染全部变量. 
            //   如果变量为undefined, 前台将不显示该变量
            // c:change
            //   已向前台发送过该用户的convo, 前台将渲染非undefined变量
            //   如果变量为undefined, 前台将保留上一次变量值
            // r:remove
            //   删除对应的convo
            "action": action,
            
            // Int | 消息时间戳 | (new Date()).getTime()
            "time": timestamp, 
            
            // Str | 消息内容 | 
            "message": message,
            
            // Str | 用户昵称 | 
            "nickName": nickName,
            
            // Str | 用户头像地址 | 头像的url地址
            "avatar": avatar,
            
            // Int | 未读消息数 | 该用户当前未读消息数量, 一般在用户头像附近标注.
            "counter": counter,
            
            // Bool | 该用户被静音 | 前台收到该convo是否要发出声音等提醒. true为被静音
            "muted": muted,
            
            // Int | convo标号 | 该用户对应的convo在位于全部convo序列号, 0代表第一位.
            "index": index
}
```



#### "Dialog"

发送右侧消息记录. content为数组

``` javascript
"Dialog": MSGList
// MSGList为Array()
// 每个元素MSG为一个Obj. 
// MSG在MSGList中按照时间顺序排序
```

##### MSG说明

```  javascript
// MSG内容
{
    // Str | 发送者昵称 |
	"from": nickName,
    // Str | MSG ID | 该条消息的ID, 对应单个用户, msgID应具有唯一性.
	"msgID": MSGID,
    // Int | 消息时间戳 | (new Date()).getTime()
	"time": timestamp,
    // Str | 消息类型 | "text","img", "url", unknown
	"type": type,
    // Str | 消息内容 | 
	"content": content
}
```



## 3rd-app preload



## 开发说明(transduction)

### 变量名称规范

#### 类声明
- td****作为类的名字

#### newConvo (conversation)
- userID : str（实际上是convo的id）
- nickName : str
- time : ~~JS Date~~, number(Date.now())
- avatar : str
- message : str
- counter : int
- index : int
- muted  : bool
- action : str (ie. "a","r","c"etc) a:add r:remove c:change

add : 检测没有userID就添加会话, 有ID就进行覆盖
change : 检测userID, 没有就忽略消息. 有的话, 刷新非undefined变量.

#### dialog (对话** 描述右侧变量名称)
例如dialog box 对话盒子.

#### html ID
- 左侧和右侧窗口ID
 - 左侧 : td-left
 - 右侧 : td-right

- webview ID & Tag


#### 各种类型：
    - 手机上发消息，左边message变化，但是没有counter变化
    - 群组和机器人聊天中改头像，影响id获取

#### 读取右半边消息
- 区分消息类别, 并给类别编码, 如图片, 语音, 视频等
- 获取非文字信息的缩略图。 比如视频要显示一个截图
- 点击缩略图做出响应。如点击图片加载大图，点击视频播放视频等

#### 聊天内容格式规范
-  class chatLog
    - msgID（string）
    - type（类型：文字，图片，url，不支持）（string）
      "text","img", "url", "unknown"
    - from（昵称 string，如果是自己，undefined）
    - time（number）
    - message（string）
- array of 上面的object （顺序从上到下）