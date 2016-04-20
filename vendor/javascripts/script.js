
<!--start-smoth-scrolling-->
jQuery(document).ready(function($) {
    $(".scroll").click(function(event){   
        event.preventDefault();
            $('html,body').animate({scrollTop:$(this.hash).offset().top},1000);
        });
    });
<!--start-smoth-scrolling-->

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

//获取注册时间  --事件触发待改（刷身份证）
var iDate = new Date()
var iTime = iDate.getFullYear() + "-" + iDate.getMonth() + "-" + iDate.getDate() 
+ "  " + iDate.getHours() + ":" + iDate.getMinutes()

$(document).ready(function(){
    $("#rbtn").click(function(){
        $("#rtime").val(iTime);
    });
});

//定义执行失败后的函数
function ErrorTips(msg){
    var alms= msg.message
    switch (msg.status){
        case 0: alert(alms);break;
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

//上传注册信息   (if验证表单)
$(document).ready(function(){
    $("#rbtn").click(function(){
        $.ajax({
            type:"POST",
            url:"/passport/register",
            contentType: "application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "name" : $("#rname").val(),
                "cid" : $("#rcid").val(),
                "placeid" : $("#rplace").val(),
                "photo" : "即时拍摄的照片Base64",
                "faceFeature" : "从即时照片中提取的脸的feature"
            }),
            success: function(){
                alert("登记成功");
            },
            error: function(remsg){  //(rmsg)删?
                ErrorTips(remsg);
            },
            complete: function(){  //功能待修正
                $("#rname,#rcid,#rtime").empty();
            }
        });
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
                "faceFeature" : "从即时照片中提取的脸的feature",
                "placeid" : $("#cplace").val()
            }),
            success: function(cmsg){
                $("#cname").val(cmsg.meta.name);
                $("#ccid").val(cmsg.meta.cid);
                $("#ctime").val(iTime);
                alert("验证成功");
            },
            error: function(cemsg){
                ErrorTips(cemsg);
            },
            complete:function(){
                $("#cname,#ccid,#ctime").empty();
            }
        });
    });
});

