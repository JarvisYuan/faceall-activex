# Common接口API文档

Common接口负责提供服务中的通用服务。

下面的URL中所有以`:`开头的是URL参数，会在各个接口中进行说明。

### 默认返回形式

所有的接口默认都返回以下形式的消息：
```json
{
  "message": "状态信息",
  "status": 状态码（数字）,
  "meta": 附加信息（JSON对象形式）
}
```
其中，状态码为0代表执行成功，否则表示执行失败，执行失败的状态码请参见错误信息。

### 文件上传

上传任意格式、任意数量的文件，需要以form-data/multipart格式发送POST请求
- URL：/common/upload
- 方法：POST
- POST参数（form-data/multipart）
    - [name1] name1的第1个文件
    - [name1] name1的第2个文件
    ......
    - [name2] name2的第1个文件
    ......
- 成功时的返回信息：
```json
{
  "message": "success",
  "status": 0,
  "meta": {
    "name1": [
      "name1第1个文件的保存路径（相对于/public/uploads）",
      "name1第2个文件的保存路径（相对于/public/uploads）",
      ......
    ],
    ......
  }
}
```

### 错误信息

无
















