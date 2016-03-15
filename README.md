#faceall-activex

## Deploy
`npm install`（可能需要翻墙）

`./bin/install`，按提示操作即可

## 手动配置

请配置`config.js文件`

## Start Developing

第一步：分别敲下`mongod --auth`，`grunt`

第二步：尽情的玩耍吧！

## Front End

在`vendor/javascripts`下添加和修改JavaScript文件，所有文件会被自动打包成`faceall-activex.min.js`，放在`public/javascripts`目录下，请确保所有页面只引用这个JS文件。

在`vendor/stylesheets`下添加和修改CSS文件，所有文件会被自动放在`public/stylesheets`目录下，请确保所有页面只引用这里的CSS文件。

在`views`目录下添加和编辑ejs文件。

其他静态文件请直接放在`public`目录下。

## Server End

在`routes`目录下配置路由，在`dist`目录下编写模块。

## TODO

1. 当express文件改变时，让Grunt能够自动重启