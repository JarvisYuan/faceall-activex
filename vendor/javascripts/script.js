var score_threshold = 0.8;

var modal = {};
modal.message = function(title, content, callback) {
    $('#modal-message').find('.modal-title').text(title);
    $('#modal-message').find('.modal-body p').text(content);
    $('#modal-message').find('.btn-ok').off('click.modal-message').on('click.modal-message', callback);
    $('#modal-message').modal('show');
};


var place = null;
var place_fake_id = "56e9047d69ae45dd10d41227";

var plugin;

$(function() {
    $.ajax({
        url: '/api/place/' + place_fake_id,
        type: 'GET',
    })
    .done(function(data) {
        place = data;
        $('#place-info').text("当前位置：" + place.name);
    })
    .fail(function() {
        modal.message("警告", "加载位置信息失败，请刷新页面重试");
    })
    .always(function() {
    });
    plugin.onCameraClosed = function () {
        $('#button-close-camera').hide();
        $('#button-open-camera').show();
    };
});


plugin = new FaceallPlugin(document.getElementById('faceall-plugin'));

if (page_type == "register") {
    $(function() {
        var registerRequired = false;
        var registerCompleted = true;
        var cardInfo;
        function registerFailedCallback(msg) {
            $('#status-hint')
            .removeClass('success')
            .addClass('error')
            .text("验证失败，" + msg + "。请重新放置身份证重试。");
            registerRequired = false;
            registerCompleted = true;
            setTimeout(function(){
                if (!registerRequired) {
                    $('#idcard-section-not-detected').show();
                    $('#idcard-section').hide();
                }
            }, 10000);
        };
        function registerSuccessCallback(msg) {
            $('#status-hint')
            .addClass('success')
            .removeClass('error')
            .text("验证成功，请进。");
            registerRequired = false;
            registerCompleted = true;
            setTimeout(function(){
                if (!registerRequired) {
                    $('#idcard-section-not-detected').show();
                    $('#idcard-section').hide();
                }
            }, 10000);
        };
        plugin.onCard = function(data) {
            cardInfo = data;
            $('#idcard-portrait').attr('src', "data:image/jpeg;base64," + cardInfo.Portrait.Base64);
            $('#idcard-name').text(cardInfo.Name);
            $('#idcard-code').text(cardInfo.CardId);
            $('#idcard-section-not-detected').hide();
            $('#idcard-section').show();
            if (registerCompleted) {
                $('#status-hint')
                .removeClass('success')
                .removeClass('error')
                .text("正在验证，请稍后...");
                registerRequired = true;
            }

        };
        plugin.onCameraFrame = function (_im) {
            if (!_im) return;
            $('#camera-frame').attr('src', "data:image/jpeg;base64," + _im.Base64);
            // document.getElementById('info').innerHTML = "" + _im.Width + " x " + _im.Height;
            var rect = plugin.detectCurrentFaceRect();
            var rectEl = $('#camera-face-rect');
            if (rect.Width > 0 && rect.Height > 0) {
                rectEl.css({
                    top: rect.Y + "px",
                    left: rect.X + "px",
                    width: rect.Width + "px",
                    height: rect.Height + "px"
                }).show();
            } else {
                rectEl.hide();
                return;
            }

            if (registerRequired) {
                registerRequired = false;
                registerCompleted = false;
                var featurePhoto = plugin.faceallExtractFeature(_im);
                var featurePortrait = plugin.faceallExtractFeature(cardInfo.Portrait);
                var jsFeaturePhoto = disparray2jsarray(featurePhoto);
                var jsFeaturePortrait = disparray2jsarray(featurePortrait);
                if (jsFeaturePortrait.length != 512) {
                    registerFailedCallback("身份证照片不合法");
                    return;
                }
                if (jsFeaturePhoto.length != 512) {
                    registerRequired = true;
                    return;
                }
                var score = plugin.faceallCompareFeatures(featurePhoto, featurePortrait);
                var photoPath = null;
                var portraitPath = null;
                function uploadSuccessCallback() {
                    $.ajax({
                        url: '/api/passport/register',
                        type: 'POST',
                        data: {
                            "cid": cardInfo.CardId,
                            "name": cardInfo.Name,
                            "placeid": place._id,
                            "photo_feature": JSON.stringify(jsFeaturePhoto),
                            "photo_imgpath": photoPath,
                            "portrait_feature": JSON.stringify(jsFeaturePortrait),
                            "portrait_imgpath": portraitPath
                        }
                    })
                    .done(function(result) {
                        if (result) {
                            if (result.status == 0 || result.status == 1003) {
                                registerSuccessCallback();
                            } else if (result.status == 2002) {
                                registerFailedCallback("证件不匹配");
                            } else {
                                registerFailedCallback("发生未知错误");
                            }
                        } else {
                            registerFailedCallback("网络异常");
                        }
                    })
                    .fail(function() {
                        registerFailedCallback("网络异常");
                    })
                    .always(function() {
                    });
                    
                };
                if (score > score_threshold) {
                    plugin.uploadImage(window.location.origin + "/api/common/upload", _im, function (res) {
                        photoPath = res;
                        if (portraitPath) uploadSuccessCallback();
                    }, function () {
                        registerFailedCallback("上传图像失败");
                    });
                    plugin.uploadImage(window.location.origin + "/api/common/upload", cardInfo.Portrait, function (res) {
                        portraitPath = res;
                        if (photoPath) uploadSuccessCallback();
                    }, function () {
                        registerFailedCallback("上传图像失败");
                    });
                } else {
                    registerFailedCallback("证件不匹配");
                }
            }
        };
    });
} else {
    $(function() {
        var checkCompleted = true;
        function checkSuccessCallback(cardInfo) {
            $('#idcard-portrait').attr('src', cardInfo.photo);
            $('#idcard-name').text(cardInfo.name);
            $('#idcard-code').text(cardInfo.cid);
            $('#status-hint').text(cardInfo.name + "，请进");
            $('#idcard-section-not-detected').hide();
            $('#idcard-section').show();
            setTimeout(function() {
                $('#status-hint2')
                .removeClass('error')
                .text("正在检测访客...");
                $('#idcard-section-not-detected').show();
                $('#idcard-section').hide();
                checkCompleted = true;
            }, 10000);
        };
        function checkFailedCallback(msg) {
            $('#status-hint2')
            .addClass('error')
            .text("验证失败，（" + msg + "）");
            $('#idcard-section-not-detected').show();
            $('#idcard-section').hide();
            setTimeout(function() {
                $('#status-hint2')
                .removeClass('error')
                .text("正在检测访客...");
                checkCompleted = true;
            }, 5000);
        };
        plugin.onCameraFrame = function (_im) {
            if (!_im) return;
            $('#camera-frame').attr('src', "data:image/jpeg;base64," + _im.Base64);
            var rect = plugin.detectCurrentFaceRect();
            var rectEl = $('#camera-face-rect');
            if (rect.Width > 0 && rect.Height > 0) {
                rectEl.css({
                    top: rect.Y + "px",
                    left: rect.X + "px",
                    width: rect.Width + "px",
                    height: rect.Height + "px"
                }).show();
            } else {
                rectEl.hide();
                return;
            }

            if (checkCompleted) {
                checkCompleted = false;
                var featurePhoto = plugin.faceallExtractFeature(_im);
                var jsFeaturePhoto = disparray2jsarray(featurePhoto);
                if (jsFeaturePhoto.length != 512) {
                    checkCompleted = true;
                    return;
                }
                plugin.uploadImage(window.location.origin + "/api/common/upload", _im, function (res) {
                    photoPath = res;
                    $.ajax({
                        url: '/api/passport/checkin',
                        type: 'POST',
                        data: {
                            "placeid": place._id,
                            "photo_feature": JSON.stringify(jsFeaturePhoto),
                            "photo_imgpath": photoPath
                        }
                    })
                    .done(function(result) {
                        if (result) {
                            if (result.status == 0) {
                                checkSuccessCallback(result.meta.visitors[0]);
                            } else if (result.status == 2001) {
                                checkFailedCallback("找不到该访客");
                            } else {
                                checkFailedCallback("发生未知错误");
                            }
                        } else {
                            checkFailedCallback("网络异常");
                        }
                    })
                    .fail(function() {
                        checkFailedCallback("网络异常");
                    })
                    .always(function() {
                    });
                }, function () {
                    checkFailedCallback("上传图像失败");
                });
            }
        };
    });
}

function openCamera() {
    if (plugin.openCamera(0)) {
        $('#button-open-camera').hide();
        $('#button-close-camera').show();
    } else {
        modal.message("警告", "开启相机失败");
    }
}
function closeCamera() {
    plugin.closeCamera();
}
function openReader() {
    if (plugin.openCardReader()) {
        $('#button-open-reader').hide();
        $('#button-close-reader').show();
    } else {
        modal.message("警告", "开启读卡器失败");
    }
}
function closeReader() {
    if (plugin.closeCardReader()) {
        $('#button-close-reader').hide();
        $('#button-open-reader').show();
    } else {
        modal.message("警告", "关闭读卡器失败");
    }
}