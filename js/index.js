const td = require('td')

extList = new td.tdList()

console.log(extList.list)

extList.getListInSore('tdSettings.extList', td.tdExt.fromJSON)

extList.print()