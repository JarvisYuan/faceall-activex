
// <!--start-smoth-scrolling-->
jQuery(document).ready(function($) {
    $(".scroll").click(function(event){   
        event.preventDefault();
            $('html,body').animate({scrollTop:$(this.hash).offset().top},1000);
        });
    });
// <!--start-smoth-scrolling-->

$(function () {
    $("#slider").responsiveSlides({
        auto: true,
        nav: true,
        speed: 500,
        namespace: "callbacks",
        pager: true,
    });
});

$(document).ready(function () {
    $('#horizontalTab').easyResponsiveTabs({
        type: 'default', //Types: default, vertical, accordion           
        width: 'auto', //auto or any width like 600px
        fit: true   // 100% fit in a container
    });
});

/**
//新增地点
$(document).ready(function(){
    $.ajax({
        type:"POST",
        url:"/api/place/",
        contentType: "application/json; charset=utf-8",
        dataType:"json",
        data: JSON.stringify({ "name": "外院正门", "roles": "o2o" }),
    });
});

//删除地点
$(document).ready(function(){
    $.ajax({
        type:"DELETE",
        url:"/api/place/5710976ece45f0e42625e9d8",
    });
});

//弹出表单信息
$(document).ready(function(){
    $("#rbtn").click(function(){
        alert(  "姓名: " +     $("#rname").val()
            +"\r 身份证: " +   $("#rcid").val()
            +"\r 登记时间: " + $("#rtime").val()
            );
    });
});

//从控件获取表单信息
$(document).ready(function(){
    $("#rname").val(     );
    $("#rcid").val(     );
    $("#rtime").val();
});
**/

//获取place下拉列表信息
$(document).ready(function(){
    $.ajax({
        type: "GET",
        url: "/api/place/",
        dataType: "json",
        success: function(place){
            $('.selpla').empty();
            var htop= '';
            $.each( place, function(key, val){
                htop +='<option value="'+place[key]._id+'">'+ place[key].name +'</option>';
            });
            $('.selpla').html(htop);
        }
    });
});

//获取注册时间 --事件触发（刷身份证）
$(document).ready(function(){
    $("#rbtn").click(function(){
        var iDate = new Date()
        var iTime = iDate.getFullYear() + "-" + iDate.getMonth() + "-" + iDate.getDate() 
        + "  " + iDate.getHours() + ":" + iDate.getMinutes()
        $("#rtime").val(iTime);
    });
});

//执行失败返回信息
function ErrorTips(msg){
    var alms= msg.message
    switch (msg.status){
        case 1001: alert(alms);break;
        case 1002: alert(alms);break;
        case 1003: alert(alms);break;
        case 1004: alert(alms);break;
        case 1005: alert(alms);break;
        case 1006: alert(alms);break;
        case 2001: alert(alms);break;
        case 2002: alert(alms);break;
        case 9999: alert(alms);break;
        default:alert("Unknown Error");break;
    };
};


//helper = new ActiveXObject("FaceallPlugin.DispFaceallHelper");
var plugin = new FaceallPlugin(document.getElementById('myactivex'));
var im = null;
features = [];

function openCamera() {
    plugin.openCamera(0);
}
function closeCamera() {
    plugin.closeCamera();
}

$("#rpic,#cpic").toggle(
    function(){
        openCamera()
    };
    function(){
        closeCamera()
    };
);

//canvas
plugin.onCameraFrame = function (_im) {
    im = _im;
    if (!im) return;
    var drawing = document.getElementById("rpic");
    if (drawing.getContext) {
        var context = drawing.getContext("2d");
        var image = document.creatElement("img");
        image.src = "data:image/jpeg;base64," + im.Base64;
        context.drawImage(image,0,0);  //将img放入canvas(0,0)坐标

        var rect = plugin.detectCurrentFaceRect();  //绘制人脸矩形框
        if (rect.Width > 0 && rect.Height > 0) {
            context.strokeStyle = "#FF0000";
            context.strokeRect (rect.X, rect.Y, rect.Width, rect.Height);
        };
    };
};

plugin.onCameraClosed = function () {
    if (im) {
        var ftr = plugin.faceallExtractFeature(im);
        features.push(ftr);
        if (features.length > 1) {
            feature1 = features[features.length - 2];
            feature2 = features[features.length - 1];
            score = plugin.faceallCompareFeatures(feature1, feature2);
        }
    }
    if (im) {
        plugin.uploadImage("http://192.168.1.110:3000/api/common/upload", im, function (res) {
            alert("Image uploaded:" + res);
        }, function () {
            alert("Image upload failed.");
        });
    }
}



function openReader() {
    if (!plugin.openCardReader()) alert("failed to open reader");
}
function closeReader() {
    if (!plugin.closeCardReader()) alert("failed to close reader");
}

$("#ridp").toggle(
    function(){
        openReader();
    };
    function(){
        closeReader();
    };
);


plugin.onCard = function (info) {
    var context = drawing.getContext("2d");
    var image = document.creatElement("img");
    context.drawImage(image,0,0);
    image.src = "data:image/jpeg;base64," + info.Portrait.Base64;
    document.getElementById('rname').innerHTML = info.Name;
    document.getElementById('rcid').innerHTML = info.CardId;
}


//上传注册信息   (验证表单)
$(document).ready(function(){
    $("#rbtn").click(function(){
        if ( !$("#rcid").val()) {
            alert("请完善注册信息后，再提交登记！");
            return false;
        } else {
            $.ajax({
                type:"POST",
                url:"/passport/register",
                contentType: "application/json; charset=utf-8",
                dataType:"json",
                data: JSON.stringify({
                    "name" : $("#rname").val(),
                    "cid" : $("#rcid").val(),
                    "placeid" : $("#rplace").val(),
                    "portrait_imgpath" : "证件照",
                    "portrait_feature" : feature1,
                    "photo_imgpath" : "即时照片",
                    "photo_feature" : feature2
                }),
                success: function(){
                    alert("登记成功");
                },
                error: function(remsg){  //(rmsg)删?
                    ErrorTips(remsg);
                },
                complete: function(){  //img待修正
                    $("#rname,#rcid,#rtime").empty();
                }
            });
        };
    });
});

//上传验证信息
$(document).ready(function(){
    $("#cbtn").click(function(){
        $.ajax({
            type:"POST",
            url:"/passport/register",
            contentType: "application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "placeid" : $("#cplace").val(),
                "photo_imgpath" : "即时照片",
                "photo_feature" : ""
            }),
            success: function(cmsg){
                    $("#cname").val(cmsg.meta.visitor.name);
                    $("#ccid").val(cmsg.meta.visitor.cid );
                    $("#ctime").val(cmsg.meta.visitor.validPeriod.start);
                    $("#crpic").attr("src","data:image/jpg;base64," + cmsg.meta.visitor.photo);
                    $("#gray").show();
                    $(".fpopup").show();  //弹出验证结果窗口
                    tc_center();
            },
            error: function(cemsg){
                ErrorTips(cemsg);
            },
            complete:function(){
                $("#crpic,#cname,#ccid,ctime").empty();
            }
        });
    });
});

//临时触发显示隐藏窗口
$(document).ready(function(){
    $("#tc1").click(function(){
        $("#gray").show();
        $(".fpopup").show();//查找ID为fpopup的DIV show()显示#gray
        tc_center();
    });
});

//定义函数 弹出窗口水平居中
function tc_center(){
    _top=($(window).height()-$(".fpopup").height())/2;
    _left=($(window).width()-$(".fpopup").width())/2;
    $(".fpopup").css({top:_top,left:_left});
};
$(window).resize(function(){
    tc_center();
});

//鼠标移动窗口
$(document).ready(function(){ 
    $(".top_nav").mousedown(function(e){ 
        var x = e.screenX;//获得鼠标指针相对bom的x坐标
        var y = e.screenY;//获得鼠标指针相对bom的y坐标
        $(this).css("cursor","move");//改变鼠标指针的形状 
        $(document).bind("mousemove",function(ev){ 
        //绑定鼠标的移动事件，因为光标在DIV元素外面也要有效果，所以要用doucment的事件，而不用DIV元素的事件
            $(".fpopup").stop();//加上这个之后 
            var _x = ev.screenX - x + _left;//获得X轴方向移动后的坐标 
            var _y = ev.screenY - y + _top;//获得Y轴方向移动后的坐标
            $(".fpopup").animate({left:_x+"px",top:_y+"px"},10); 
        }); 
    }); 
    $(document).mouseup(function() { 
        $(".fpopup").css("cursor","default"); 
        $(this).unbind("mousemove"); 
    });
});

//隐藏验证结果窗口,并清空访客信息
$(document).ready(function(){
    $("a.guanbi,#conbtn").click(function(event){
        $("#gray").hide();
        $(".fpopup").hide();
        $("#cname,#ccid,#ctime").empty();
    });
});


