/**
 * FileName:
 *
 * Author:wangyan
 * Date:2013-10-26 14:50
 * Version:V1.0.0.0
 * Email:yywang1991@gmail.com
 * Describe:   文件上传类
 * Change Record:
 * {        date    name    describe}
 *
 */

var fs = require('fs');
var utils = require('../utils/fileUtils');
var promise = require('promise');
//压缩包
const Path = require("path");
var ExtractPath = require('../config').G.ExtractPath;
const child_process = require('child_process');

function uploader(req, res) {
    if (req.files != 'undifined') {
        console.dir(req.files);
        utils.mkDir().then(function (path) {
            uploadFile(req, res, path, 0);
        });

    }
}

function uploadFile(req, res, path, index) {
    var tempPath = req.files.file[index].path;
    var name = req.files.file[index].name;
    var extName = Path.extname(name);
    var isSuccess =false;
    if (tempPath) {
        var rename = promise.denodeify(fs.rename);
        rename(tempPath, path + name).then(function () {
            var unlink = promise.denodeify(fs.unlink);
            unlink(tempPath);
        }).then(function () {
                if (index == req.files.file.length - 1) {
                    console.log("上传完成开始解压");

                    if(extName === ".zip"){
                        // 开始解压
                        const StreamZip = require('node-stream-zip');
                        const zip = new StreamZip({
                            file: path + name,
                            storeEntries: true
                        });
                        zip.on('ready', () => {
                            zip.extract(null, ExtractPath, (err, count) => {

                                console.log(err ? 'Extract error' : `Extracted ${count} entries`);
                                zip.close();
                                if(err){
                                    sendUploadFailed(res,"解压失败！");
                                }else{
                                    child_process.execFileSync('sh /home/pi/keep.sh',{shell: '/bin/bash'})
                                    isSuccess=true;
                                    //成功
                                    sendUploadSuccess(res);

                                }
                                //执行完推出
                                console.log("退出生效")
                                if(isSuccess){
                                    console.log("开始重启电脑")
                                    setTimeout(function() {
                                        console.log("重启电脑生效")
                                        child_process.execSync('reboot')
                                    }, 10000);
                                }
                            });
                        });
                    }else{
                        //执行完推出
                        child_process.execSync('exit')
                        console.log("请上传正确的格式文件！")
                        sendUploadFailed(res,"请上传正确的格式文件！")
                    }

                } else {
                    uploadFile(req, res, path, index + 1);
                }
            });
    }
}

function sendUploadSuccess(res) {
    res.send('{code:1,des:"上传成功"}');
}

function sendUploadFailed(res,info) {
    res.send('{code:0,des:"上传失败"'+info+'}');
}

function index(req, res) {
    res.render('file');
}


exports.uploader = uploader;
exports.index = index;

