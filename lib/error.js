var responseStatusMessageMap = [];
responseStatusMessageMap[0]    = "success";
responseStatusMessageMap[9999] = "unknown error";
responseStatusMessageMap[1001] = "could not detect any face in photo";
responseStatusMessageMap[1002] = "could not detect any face in portrait";
responseStatusMessageMap[1003] = "visitor has already been registered";
responseStatusMessageMap[1004] = "registration is not allowed at this place";
responseStatusMessageMap[1005] = "cannot find the place";
responseStatusMessageMap[2001] = "no match face found";

exports.CommonError = function(message, meta) {
    this.message = message;
    meta = meta || {};
    if (meta instanceof exports.CommonError) {
        this.meta = {};
        this.extError = meta;
    } else {
        this.meta = meta;
    }

    this.print = function(recursion) {
        recursion = recursion || 0;
        var startTabs = "";
        for (var i = 0; i < recursion; i++) startTabs += "  ";
        var args = [startTabs, message, "\n"];
        if (this.meta && (Object.keys(this.meta).length > 0)) {
            args.push(startTabs);
            args.push("Meta:");
            args.push(meta);
            args.push("\n");
        }
        if (this.extError) {
            args = args.concat(this.extError.print(recursion + 1));
            args.push("\n");
        }
        if (recursion == 0) {
            args.splice(0,0," ==============================\n");
            args.push("==============================\n");
            console.error.apply(console, args);
        }
        return args;
    };
};

exports.ResponseError = function(status, message, meta) {
    this.message = message;
    this.status = parseInt(status);
    if (isNaN(this.status)) this.status = 9999;
    this.message = message || responseStatusMessageMap[this.status] || responseStatusMessageMap[9999];
    this.meta = meta || {};

    this.toJson = function() {
        var json = {
            status: this.status,
            message: this.message
        };
        for (var k in meta) json[k] = meta[k];
        return json;
    };
};

exports.ResponseError.SUCCESS = new exports.ResponseError(0);
exports.ResponseError.UNKNOWN = new exports.ResponseError(9999);