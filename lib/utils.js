global.String.prototype.format = function() {
    var reg = /%(([\S\s])??(\d))??([dfs])/g;
    var matches = [];
    var nextIndex = 0;
    var splits = [];
    for (var i = 0; i < arguments.length; i++) {
        var m = reg.exec(this);
        if (!m) throw { message: "arguments count does not match placeholders count" };
        matches.push(m);
        splits.push(this.substr(nextIndex, m.index - nextIndex));
        nextIndex = m.index + m[0].length;
    }
    if (splits.length !== arguments.length) throw { message: "arguments count does not match placeholders count" };
    splits.push(this.substr(nextIndex, this.length - nextIndex));
    var str = splits[0];
    for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        var type = m[4];
        var phrase = "";
        if (type == 's') {
            if (typeof arguments[i] !== "string") throw { message: "argument type [" + (typeof arguments[i]) + "] do not match placeholder \"" + m[0] + "\". at index " + i };
            phrase = arguments[i];
        } else if (type == 'd') {
            if ((typeof arguments[i] !== "number") && (parseInt(arguments[i]) !== arguments[i])) throw { message: "argument type [" + (typeof arguments[i]) + "] do not match placeholder \"" + m[0] + "\". at index " + i };
            phrase = "" + arguments[i];
            if (m[3]) {
                if (m[2]) {
                    while (phrase.length < parseInt(m[3])) {
                        phrase = m[2] + phrase;
                    }
                }
            }
        } else if (type == 'f') {
            if (typeof arguments[i] !== "number") throw { message: "argument type [" + (typeof arguments[i]) + "] do not match placeholder \"" + m[0] + "\". at index " + i };
            phrase = "" + arguments[i];
        }
        str = str + phrase + splits[i + 1];
    }
    return str;
}

global.extend = function() {
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[ 0 ] || {},
        i = 1,
        length = arguments.length,
        deep = false;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
        deep = target;

        // Skip the boolean and the target
        target = arguments[ i ] || {};
        i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
        target = {};
    }

    // Extend jQuery itself if only one argument is passed
    if ( i === length ) {
        target = this;
        i--;
    }

    for ( ; i < length; i++ ) {

        // Only deal with non-null/undefined values
        if ( ( options = arguments[ i ] ) != null ) {

            // Extend the base object
            for ( name in options ) {
                src = target[ name ];
                copy = options[ name ];

                // Prevent never-ending loop
                if ( target === copy ) {
                    continue;
                }

                // Recurse if we're merging plain objects or arrays
                if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
                    ( copyIsArray = jQuery.isArray( copy ) ) ) ) {

                    if ( copyIsArray ) {
                        copyIsArray = false;
                        clone = src && jQuery.isArray( src ) ? src : [];

                    } else {
                        clone = src && jQuery.isPlainObject( src ) ? src : {};
                    }

                    // Never move original objects, clone them
                    target[ name ] = extend( deep, clone, copy );

                // Don't bring in undefined values
                } else if ( copy !== undefined ) {
                    target[ name ] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
};

global.fileCopy = function(src, dst) {
    var fs = require('fs');
    if (fs.existsSync(src) && fs.statSync(src).isFile()) {
        var readStream = fs.createReadStream( src );
        var writeStream = fs.createWriteStream( dst );
        readStream.pipe(writeStream);
    } else {
        throw { message: "file does not exist!"};
    }
};

global.arrayMerge = function() {
    var arrays = arguments;
    var mergedArray = [];
    for (var i = 0; i < arguments.length; i++) {
        for (var j = 0; j < arguments[i].length; j++) {
            if (mergedArray.indexOf(arguments[i][j]) < 0) {
                mergedArray.push(arguments[i][j]);
            }
        }
    }
    return mergedArray;
};