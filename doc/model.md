# 模型参考

### Visitor：来访者
```json
{
    "_id" : "内部id",
    "cid" : "18位身份证号",
    "name" : "来访者姓名",
    "faceId" : "从其证件照中提取的脸的id",
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

### Image：图片
```json
{
    "_id" : "内部id",
    "apiId" : "FaceAll API 服务 中的图片id",
    "faceIds" : [ // 检测出的脸
        "uDlQuXYEs6yyHQWSaVMPlHM4yXPL0sTjqmZyecFO"
    ]
}
```

### VisitHistory：验证通关记录
```json
{
    "_id" : "内部id",
    "visitorId" : "来访者的内部id",
    "placeId" : "验证地点的内部id",
    "imageId" : "验证时用的即时照片的内部id",
    "time" : ISODate("验证通关时间"),
}
```

### RegisterHistory：注册记录
```json
{
    "_id" : "内部id",
    "visitorId" : "来访者的内部id",
    "placeId" : "注册地点的内部id",
    "imageId" : "注册时用的身份证照片的内部id",
    "time" : ISODate("注册时间"),
}
```