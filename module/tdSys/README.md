#tdSys

- relative with system
- specific classes in transduction operating system

---

## class: tdFileSend

#### New fileSend(name, path, webkitRelativePath, [fileID], [dataUrl])

### Static Priorities

### Static Methods

### Instance Events

### Instance Methods

#### convertFile(file)

copy file information

##### Input

- file `tdFileSend` : 被拷贝的file

#### addFileID(fileID)

添加ID

##### Input

- fileID `string` : ID

#### addDataUrl(dataUrl)

添加dataURL

##### Input

- dataUrl `String` : 形如 `data:[<mediatype>][;base64],<data>`

#### print()

打印tdFileSend信息

#### localSave()

储存文件到系统临时文件夹. 

##### Output

`Promise` 是否储存成功

path将被替换为储存后的路径.

#### clear()

删除本地文件.

### Instance priorities

- name `String` 文件名
- path `String` 文件本地路径 webkitRelativePath=''
- webkitRelativePath `String` 文件远程路径. 
- fileID `String` 独一无二的ID
- dataUrl `String` 储存图片的dataUrl

----

## class : tdOS

### Static Priorities

- strUserAgentWin : Winodws user-agent
- strUserAgentLinux : Linux user-agent

### Static Methods

#### removeDir(dir)

删除文件夹及其子文件夹

##### Input

- dir `String` : 要删除的文件夹绝对路径