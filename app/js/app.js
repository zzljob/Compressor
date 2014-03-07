global.$ = $;

var gui = require('nw.gui');
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var UglifyJS = require("uglify-js");
var CleanCSS = require('clean-css');

var new_win;

$(document).ready(function() {
	$("#btn_open").click(function() {
		openChoice();
	});
	$("#btn_go").click(function() {
		var path = $("#src_input").val();
		check(path);
		$("#progress").show().find(".progress-bar").css("width", "0%");
		var outPath = path + "min/";
		compilerPath(path, outPath);
	});

	// Listen to main window's close event
	gui.Window.get().on('close', function() {
		// Hide the window to give user the feeling of closing immediately
		this.hide();

		// If the new window is still open then close it.
		if (new_win != null) {
			new_win.close(true);
		}

		// After closing the new window, close the main window.
		this.close(true);
	});
});
function check(path) {
	if (!fs.existsSync(path)) {
		$('#src_input').attr("data-content", "该路径不存在").popover("show");
		return false;
	}
	var stat = fs.lstatSync(path);
	if (!stat.isDirectory()) {
		$('#src_input').attr("data-content", "这貌似不是一个目录啊").popover("show");
		return false;
	}
	return true;
}
function compilerPath(dirSrc, dirTarget) {
	console.debug("dirSrc:" + dirSrc);
	console.debug("dirTarget:" + dirTarget);
	if (!fs.existsSync(dirSrc)) {
		console.error("dirTarget not exists");
		return false;
	}
	if (!fs.existsSync(dirTarget)) {
		console.info("mkdir:" + dirTarget);
		mkdirSync(dirTarget, "0777");
	}

	var findAndProcess = function(cmd) {
		console.info("@cmd:" + cmd);
		childProcess.exec(cmd, function(err, stdout, stderr) {
			if (err) {
				console.error(err);
				return;
			}
			console.debug("stdout:" + stdout);
			var files = stdout.split('\n');
			setAllProcessFile(files.length - 1);
			files.forEach(function(filepath, i) {
				if (filepath) {
					var outpath = filepath.replace(dirSrc, dirTarget);
					processFile(filepath, outpath);
				}
			});
		});
	};

	var cmdcss = 'find ' + dirSrc + ' -name "*.css"';
	findAndProcess(cmdcss);
	var cmdjs = 'find ' + dirSrc + ' -name "*.js"';
	findAndProcess(cmdjs);
}
var maxProgress = 100;
var minProgress = 0;
var nowProgress = 0;
function setAllProcessFile(size) {
	maxProgress = size * 3;
	minProgress = 0;
	nowProgress = 0;
}
function readOneFile() {
	nowProgress++;
	updateProgressbar();
}
function processOneFile() {
	nowProgress++;
	updateProgressbar();
}
function writeOneFile() {
	nowProgress++;
	updateProgressbar();
}
function updateProgressbar() {
	console.debug("updateProgressbar minProgress:" + minProgress + ";nowProgress:" + nowProgress + ";maxProgress:" + maxProgress);
	var progress = (nowProgress - minProgress) / (maxProgress - minProgress) * 100;
	console.debug(progress + "%");
	var pb = $("#progress").show().find(".progress-bar");
	pb.attr("aria-valuemax", maxProgress);
	pb.attr("aria-valuemin", minProgress);
	pb.attr("aria-valuenow", nowProgress);
	pb.css("width", progress + "%");
}
function processFile(filepath, outpath) {
	console.debug("filepath:" + filepath);
	console.debug("outpath:" + outpath);

	var saveFile = function(finalCode) {
		// 创建文件夹
		mkdirSync(path.dirname(outpath), "0777");
		console.info('@mkdir:', path.dirname(outpath));

		if (fs.existsSync(outpath)) {
			console.warn("file exists : " + outpath);
		}

		fs.writeFile(outpath, finalCode, function(err) {
			if (err) {
				console.error(err);
				return null;
			}
			console.info('@done:', filepath, '>', outpath);
			writeOneFile();
		});
	};

	var processJSFile = function(origCode) {
		var jsp = UglifyJS.parser;
		var pro = UglifyJS.uglify;
		var ast, finalCode = '';
		ast = jsp.parse(origCode);
		ast = pro.ast_mangle(ast);
		ast = pro.ast_squeeze(ast);
		finalCode = pro.gen_code(ast);
		console.info('@processJS:', filepath);
		saveFile(finalCode);
	};

	var processCSSFile = function(origCode) {
		//console.info(origCode);
		var minimized = CleanCSS.process(origCode);
		console.info('@processCSS:', filepath);
		saveFile(minimized);
	};

	fs.readFile(filepath, 'utf-8', function(err, data) {
		if (err) {
			console.error(err);
			return null;
		}
		console.info('@read:', filepath);
		readOneFile();

		// 处理压缩
		var extName = path.extname(filepath);
		console.debug("extName:" + extName);
		processOneFile();
		if (".css" == extName) {
			processCSSFile(data);
		} else if (".js" == extName) {
			processJSFile(data);
		} else {
			console.error("can not support this file : " + extName);
			return;
		}
	});
};
var mkdirSync = function(dirpath, mode) {
	var arr = new Array();
	var parent = dirpath;
	while (!fs.existsSync(parent)) {
		arr.push(parent);
		parent = path.dirname(parent);
	}
	for (var i = arr.length - 1; i >= 0; i--) {
		fs.mkdirSync(arr[i], 0755);
		console.debug('--mkdir:', arr[i]);
	}
};
function openChoice() {
	new_win = gui.Window.get(window.open('choice.html', {
		"position" : 'center',
		"width" : 550,
		"height" : 480,
		"new-instance" : true,
		"focus" : true
	}));

	new_win.on('closed', function() {
		if (this.folder != null) {
			$("#src_input").val(this.folder);
		}
		if (new_win != null) {
			new_win = null;
		}
		$("#btn_go").focus();
	});
}