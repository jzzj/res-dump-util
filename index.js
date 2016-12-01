var execSync = require('child_process').execSync;
var crypto = require('crypto');
var config = require('config');
var fs = require('fs');
var path = require('path');
var rootDir = process.cwd();
var glob = require('glob');
var mkdirp = require('mkdirp');

var versionCache = {};
var util = {
	// append hash code to original path.
	makeHash: function(path, hash){
		return path.replace(/(^.*\/.*?)(\..*)$/, '$1.'+hash+'$2')
	},
	mkdirp: function(dir){
		mkdirp.sync(dir);
	},
	getVersion: function(file, mode){
		mode = mode || config.versionMode;
		if(versionCache[file]!=null){
			return versionCache[file];
		}
		var versionMethod = {
			"git": function(){
				var version = execSync(`git log -1 --format="%h" -- ${file}`, {encoding:"utf8"});
				var hash = version.replace(/\s/g, "");
				//fallback
				if(!hash){
					return versionMethod["md5"]();
				}
				return hash;
			},
			"md5": function(){
				var content = fs.readFileSync(file, "utf8");
				var md5sum = crypto.createHash('md5');
				md5sum.update(String(content));
				return md5sum.digest("hex").slice(0, 8);
			}
		};
		var ret = versionMethod[mode]();
		versionCache[file] = ret;
		return ret;
	},
	relative: function(relativePath){
		return path.resolve(rootDir, ("."+relativePath).replace(/^\.{2,}/, '.'));
	},
	lookup: function(pattern, reg){
		var files = glob.sync(pattern);
		for(var i=0, len=files.length; i<len; i++){
			if(reg.test(files[i])){
				return files[i];
			}
		}
		return null;
	},
	similarLookup: function(filePath){
		var suffix = filePath.replace(/.*\/.*\.(.*?)$/, "$1");
		var rcss = /\.(css|scss|sass|less)$/;
		var rjs = /\.(js|vue|es6|jsx)$/;
		var pattern = filePath.replace(/\.[^\/]*$/, '.*');
		if(rcss.test(filePath)){
			return util.lookup(pattern, rcss);
		}else if(rjs.test(filePath)){
			return util.lookup(pattern, rjs);
		}
		return filePath;
	},
	copyFile: function(sourceFile, destFile){
		return fs.createReadStream(sourceFile).pipe(fs.createWriteStream(destFile));
	}
};

module.exports = util;