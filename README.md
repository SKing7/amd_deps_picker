#deps-picker

根据项目中特有的格式，得到最多2层级的依赖

##Features

- dep名根据父级所属进行压缩
- 使用bind实现curried function
- 分析AST得到相关依赖信息
- 

###压缩后格式示例：
```javascript
define("mod/common/deps/navigation",[],function(){
  return{
    index:[
    "$1~1/channel/channel_history",
    "$1~1/channel/channel",
    "$1~1/~1_history",
    "$2~1/~1-search-suggestion",
    "$2~1/~1-search-keywords",
    "$2~1/~1-search-keywords-li",
    "$2~1/~1_search_content_history"]
  });
```
