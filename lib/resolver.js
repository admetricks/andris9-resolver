var fetchUrl = require("fetch").fetchUrl,
    packageInfo = require("../package.json"),
    httpStatusCodes = require("./http.json"),
    urllib = require("url");

// Expose to the world
module.exports.resolve = resolve;
module.exports.removeParams = removeParams;

/**
 * Resolves an URL by stepping through all redirects
 *
 * @param {String} url The URL to be checked
 * @param {Object} options Optional options object
 * @param {Function} callback Callback function with error and url
 */
function resolve(url, options, callback){
    var urlOptions = {};
    
    if(typeof options == "function" && !callback){
        callback = options;
        options = undefined;
    }
    options = options || {};

    urlOptions.method = "HEAD";
    urlOptions.asyncDnsLoookup = true;
    urlOptions.timeout = options.timeout || 10000;
    urlOptions.agent = options.agent || packageInfo.name + "/" + packageInfo.version + " (+"+packageInfo.homepage+")";
    urlOptions.removeParams = [].concat(urlOptions.removeParams || [/^utm_/, "ref"]);

    fetchUrl(url, urlOptions, function(error, meta, body){
        var err, url;
        if(error){
            err = new Error(error.message || error);
            err.statusCode = 0;
            return callback(err);
        }
        if(meta.status != 200){
            err = new Error("Server responded with "+meta.status+" "+(httpStatusCodes[meta.status] || "Invalid request"));
            err.statusCode = meta.status;
            return callback(err);
        }
        url = meta.finalUrl;

        if(urlOptions.removeParams && urlOptions.removeParams.length){
            url = removeParams(url, urlOptions.removeParams);
        }

        return callback(null, url);
    });
}

/**
 * Removes matching GET params from an URL
 *
 * @param {String} url URL to be checked
 * @param {Array} params An array of key matches to be removed
 * @return {String} URL 
 */
function removeParams(url, params){
    var parts, query = {};

    parts = urllib.parse(url, true, true);
    delete parts.search;

    if(parts.query){
        Object.keys(parts.query).forEach(function(key){
            for(var i=0, len = params.length; i<len; i++){
                if(params[i] instanceof RegExp && key.match(params[i])){
                    return;
                }else if(key == params[i]){
                    return;
                }
            }
            query[key] = parts.query[key];
        });
        parts.query = query;
    }

    return urllib.format(parts);
}