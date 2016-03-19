# 模型参考

### Visitor：来访者
```json
{
    "_id" : "内部id",
    "cid" : "18位身份证号",
    "name" : "来访者姓名",
    "face" : {
        "feature": [特征向量],
        "imagePath": 存储在 public/uploads/ 目录下的身份证照片文件名
    },
    "validPeriod" : {
        "end" : ISODate("有效期止"),
        "start" : ISODate("有效期起")
    }
}
```

### Place：地点
```json
{
    "_id" : "内部id",
    "name" : "地点名称",
    "roles" : [ // 角色列表
        "o2o", // 表示这个地点允许1:1验证，允许来访者注册 
        "o2n", // 表示这个地点允许1:N验证，允许来访者刷脸验证身份
    ]
}
```

### VisitHistory：验证通关记录
```json
{
    "_id" : "内部id",
    "visitorId" : "来访者的内部id",
    "placeId" : "验证地点的内部id",
    "imagePath": 存储在 public/uploads/ 目录下的即时照片文件名,
    "time" : ISODate("验证通关时间"),
}
```

### RegisterHistory：注册记录
```json
{
    "_id" : "内部id",
    "visitorId" : "来访者的内部id",
    "placeId" : "注册地点的内部id",
    "imagePath": 存储在 public/uploads/ 目录下的注册所用身份证照片文件名,
    "time" : ISODate("注册时间"),
}
```