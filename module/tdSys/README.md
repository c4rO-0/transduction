#tdSys

> 与系统有关的操作(删除文件等)

---

## class : tdOS

> 与系统有关的操作

### Static Priorities

#### tdOS.strUserAgentWin

- type : String 
- default : 
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
AppleWebKit/537.36 (KHTML, like Gecko) \
Chrome/73.0.3683.121 Safari/537.36"

Winodws user-agent

#### tdOS.strUserAgentLinux

- type : String 
- default : 
"Mozilla/5.0 (X11; Linux x86_64) \
AppleWebKit/537.36 (KHTML, like Gecko) \
Chrome/73.0.3683.121 Safari/537.36"

Linux user-agent

### Priorities

#### none

### Static Methods

#### tdOS.removeDir(dir)

- dir `String` : 要删除的文件夹绝对路径

删除`dir`文件夹及其子文件夹.

### Methods

#### none