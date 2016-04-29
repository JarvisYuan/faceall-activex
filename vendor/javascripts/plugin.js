function FaceallPlugin(pluginElement) {
    this.plugin = pluginElement;
    this.capturedImage = null;
    this.capturedRect = null;

    this._cameraOpend = false;
    this._cardReaderOpened = false;

    this.onCameraClosed = null;
    this.onCameraFrame = null;
    this.onCard = null;

    var _this = this;

    var _WAIT_CARD_INTERVAL = 500;

    setInterval(function () {
        if (_this._cameraOpend && !_this.plugin.isRecording()) {
            _this._cameraOpend = false;
            if (_this.onCameraClosed) _this.onCameraClosed();
        }
    });

    this.uploadImage = function (url, im, success, failed) {
        var uploadHdl = this.plugin.UploadImage(url, "image", "image.jpg", im);
        var _this = this;
        var _wait_timer = setInterval(function () {
            if (_this.plugin.isUploadCompleted(uploadHdl)) {
                var result = _this.plugin.getUploadResult(uploadHdl);
                if (result) {
                    try {
                        result = JSON.parse(result);
                    } catch (e) {
                        result = null;
                    }
                }
                if (result && (result.status === 0) && (result.meta) && (result.meta.image) && (result.meta.image[0])) {
                    if (success) success(result.meta.image[0]);
                } else {
                    if (failed) failed();
                }
                clearInterval(_wait_timer);
            }
        }, 1);
    };

    this.openCamera = function (cameraIdx) {
        this.capturedImage = null;
        this.capturedRect = null;
        if (this.plugin.initCamera(cameraIdx)) {
            this._cameraOpend = true;
            return true;
        } else {
            return false;
        }
    };

    this.closeCamera = function () {
        this.plugin.closeCamera();
    };

    this.detectCurrentFaceRect = function () {
        return this.plugin.faceallDetectCurrentFaceRect();
    };

    this.faceallExtractFeature = function (image) {
        return this.plugin.faceallExtractFeature(image);
    };

    this.faceallCompareFeatures = function (feature1, feature2) {
        return this.plugin.faceallCompareFeatures(feature1, feature2);
    };

    this.openCardReader = function () {
        if (this.plugin.initCardReader()) {
            this._cardReaderOpened = true;
            setTimeout(this._waitCard, _WAIT_CARD_INTERVAL);
            return true;
        } else {
            return false;
        }
    };

    this.closeCardReader = function () {
        if (this.plugin.closeCardReader()) {
            this._cardReaderOpened = false;
            return true;
        } else {
            return false;
        }
    }

    this._waitCapture = function () {
        if (_this._cameraOpend && _this.plugin.hasNewCapture()) {
            _this.capturedImage = _this.plugin.grabCameraFrame();
            setTimeout(function () {
                if (_this.onCameraFrame) _this.onCameraFrame(_this.capturedImage);
            }, 0);
            setTimeout(_this._waitCapture, 15);
        } else {
            setTimeout(_this._waitCapture, 1);
        }
    };

    this._waitCard = function () {
        if (_this._cardReaderOpened) {
            var info = _this.plugin.readCard();
            if (info) {
                if (_this.onCard) _this.onCard(info);
            }
            setTimeout(_this._waitCard, _WAIT_CARD_INTERVAL);
        }
    }

    this._waitCapture();
}

function disparray2jsarray(disparray) {
    var len = disparray.Length();
    var ret = [];
    for (var i = 0; i < len; i++) {
        ret.push(disparray.GetAt(i));
    }
    return ret;
}
function jsarray2disparray(jsarray) {
    var len = jsarray.length;
    var ret = new ActiveXObject("FaceallPlugin.DispArray");
    for (var i = 0; i < len; i++) {
        ret.Push(jsarray[i]);
    }
    return ret;
}