# Passport接口API文档

Passport接口负责来访者的注册和登录。

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

### 注册

注册一个新的来访者，注册时需要提供来访者的身份证号和姓名。注册时需要上传读入的证件照和即时拍摄到的照片，两者比对成功方允许注册。如果该来访者当天已经注册过，则不可重复注册，如果该来访者曾经注册过但已经过期，则更新该来访者的信息。

- URL：/passport/register
- 方法：POST
- POST参数（form-data）
    - cid: 来访者身份证号
    - name: 来访者姓名
    - placeid: 注册地点的`_id`
    - portrait_imgpath: 读入的身份证照片上传路径
    - photo_imgpath: 即时拍摄的照片上传路径
    - photo_feature: 读入的身份证照片脸特征向量
    - portrait_feature: 即时拍摄的照片脸特征向量

### 验证

当来访者需要通过关卡时，通过此接口刷脸验证。验证时需要提供即时拍摄到的照片。

- URL：/passport/checkin
- 方法：POST
- POST参数（form-data）
    - placeid: 验证地点的`_id`
    - photo_imgpath: 即时拍摄的照片上传路径
    - photo_feature: 读入的身份证照片脸特征向量
- 成功时的返回信息：
```json
{
  "message": "success",
  "status": 0,
  "meta": {
    "visitor": {
      "_id": "56ecf434599e537d09b7622d",
      "cid": "来访者的身份证号",
      "name": "来访者姓名",
      "photo": "/public/uploads/6048f2b0-ed9d-11e5-995c-0fdbf0e5d21f.jpg"
    }
  }
}
```

### 错误信息

未知错误
```json
{
    "status": 9999,
    "message": "unknown error",
    "meta": {}
}
```
注册时该来访者已经注册过，不允许重复注册
```json
{
    "status": 1003,
    "message": "visitor has already been registered",
    "meta": {}
}
```
这个地点不允许注册
```json
{
    "status": 1004,
    "message": "registration is not allowed at this place",
    "meta": {}
}
```
这个地点不允许验证通关
```json
{
    "status": 1005,
    "message": "check-in is not allowed at this place,
    "meta": {}
}
```
找不到所提供的地点
```json
{
    "status": 1006,
    "message": "cannot find the place",
    "meta": {}
}
```
验证失败，没有匹配到已注册的用户
```json
{
    "status": 2001,
    "message": "no match face found",
    "meta": {}
}
```
注册时提供的证件照和即时照片不匹配
```json
{
    "status": 2002,
    "message": "the faces are not matched",
    "meta": {}
}
```
















