global.$ = $;

var fs = require('fs');
var path = require('path');
var os = require('os');
var gui = require('nw.gui');
var shell = gui.Shell;

jQuery(function($) {
	$(document).ready(function() {
		// enabling stickUp on the '.navbar-wrapper' class
		$("#dir_input").stickUp();
	});
});
$(document).ready(function() {
	resetWindow();
	$("#submit").click(function() {
		if ($(".btn-danger").size() < 1) {
			$("#alert").modal("show");
		} else {
			gui.Window.get().folder = $("#input_dir").val();
			gui.Window.get().close(true);
		}
	});
	var dirs = null;
	if ("win32" == os.platform()) {
		dirs = getWin32RootFolder();
	} else {
		dirs = getUNIXRootChildFolder();
	}

	$("#alldirs").html("");
	for (var i = 0; i < dirs.length; i++) {
		appendSubdir($("#alldirs"), dirs[i]);
	}
});
function resetWindow() {
	gui.Window.get().width = 400;
	gui.Window.get().height = 600;
}
function clickDirShow(dirShow) {
	var strDir = $(dirShow).attr("dir");
	$("#input_dir").val(strDir);
	var divSubdir = $(dirShow).next("div .subdir");
	var hasSubDir = false;
	if (fs.existsSync(strDir)) {
		var subDirs = fs.readdirSync(strDir);
		if (divSubdir.children().size() <= 0) {
			for (var i = 0; subDirs != null && i < subDirs.length; i++) {
				if (appendSubdir(divSubdir, path.join(strDir, subDirs[i]))) {
					hasSubDir = true;
				}
			}
		}
	}
	// 选中
	$(".btn-danger").removeClass("btn-danger");
	$(dirShow).addClass("btn-danger");

	// 关闭同级别的
	divSubdir.parent().children("div .subdir").css("display", "none");
	// 打开自己的
	if (divSubdir.children().size() > 0 && divSubdir.css("display") == "none") {
		divSubdir.css("display", "");
	} else {
		divSubdir.css("display", "none");
	}

}
function appendSubdir(parent, subdir) {
	console.info("appendSubdir : " + subdir);
	if (!fs.existsSync(subdir)) {
		console.info(subdir + " is not exists return false ");
		return false;
	}
	var stat = fs.lstatSync(subdir);
	if (!stat.isDirectory()) {
		console.info(subdir + " isDirectory return false ")
		return false;
	}
	var showDir = subdir.substring(subdir.lastIndexOf(path.sep) + 1);
	var htmlA = '<a href="#" onclick="clickDirShow(this)" class="btn btn-default btn-lg btn-sm dirshow"  role="button" dir="'
			+ subdir + '">' + showDir + '</a>';
	var htmlDiv = '<div class="btn-group-vertical subdir" style="display:none;" dir="'
			+ subdir + '"></div>';
	$(parent).append(htmlA).append(htmlDiv);
	return true;
}
function getWin32RootFolder() {
	var root = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var dirs = new Array();
	for (var i = 0; i < root.length; i++) {
		var path = root.substr(i, 1) + ":/";
		if (fs.existsSync(path)) {
			dirs.push(path);
		}
	}
	return dirs;
}
function getUNIXRootChildFolder() {
	var root = "/";
	var folders = fs.readdirSync(root);
	var dirs = new Array();
	for (var i = 0; folders != null && i < folders.length; i++) {
		dirs.push(path.join(root, folders[i]));
	}
	return dirs;
}