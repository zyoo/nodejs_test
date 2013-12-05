var mysql = require('mysql');
var exec = require('child_process').exec;
var conn = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager_dev',
    port:3306
});
var sleep = require('sleep');
var step = require('step');
var RETRY_MAX_COUNT = 3;

var countForInstallRole = 0;
var countFlagForInstallRole = 0;
var countForInstallRoleFailed = 0;

var countForConfigRole = 0;
var countFlagForConfigRole = 0;


exports.installRole = function installRole(host, role, component, retryCount, callBack) {
    if(retryCount == RETRY_MAX_COUNT) {
        console.log('host: ' + host + '; role: ' + role + ' install failed after ' + retryCount + ' retry install');
       	countForInstallRoleFailed++; 
        return;
    }
    var comp=component;
    var apiInstallRoleCmd = '';
    if(comp == 'hdfs' || comp == 'mapreduce')
        apiInstallRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop '+ role + ' install';
    else
        apiInstallRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' '+ comp +' '+ role + ' install';
    console.log(apiInstallRoleCmd);
    exec(apiInstallRoleCmd, function(err, stdout, stderr) {
        if(err) {
            console.log('err cmd is ' + apiInstallRoleCmd);
            console.log(err);
            retryCount++;
            console.log('this is the ' + retryCount + ' times retry.');
            setTimeout(function(){
                installRole(host, role, component, retryCount, callBack);
            }, 500);
        }
        else {
            checkInstallRole(host, role, component, retryCount, callBack);
        }
    }); 
}

function checkInstallRole(host, role, component, retryCount, callBack) {
    var comp = component;
    var apiCheckInstallRoleCmd = '';
    if(comp == 'hdfs' || comp == 'mapreduce') {
        apiCheckInstallRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p hadoop';
    }
    else {
        apiCheckInstallRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p ' + comp;
    }
    console.log(apiCheckInstallRoleCmd);
    exec(apiCheckInstallRoleCmd, function(err, stdout, stderr) {
        if(err) {
            console.log('err cmd is ' + apiCheckInstallRoleCmd);
            console.log(err);
            console.log('this is the ' + retryCount + ' times retry.');
            retryCount++;
            setTimeout(function(){
                installRole(host, role, component, retryCount, callBack);
            }, 500);
        }
        else {
            callBack(); 
        }
    });
}

function configRole(host, role, component, retryCount, callBack) {
    if(retryCount == RETRY_MAX_COUNT) {
        console.log('host: ' + host + '; role: ' + role + ' configRoleCmd failed.');
        return;
    }
    var comp = component;
    var apiConfigRoleCmd = '';
    if(comp == 'hdfs' || comp == 'mapreduce')
        apiConfigRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop ' + role + ' config';
    else
        apiConfigRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+host+' ' + comp + ' ' + role + ' config';
    exec(apiConfigRoleCmd, function(err, stdout, stderr) {
        if(err) {
            console.log(err);
            retryCount++;
            console.log('this is the ' + retryCount + ' time retry.');
            setTimeout(function() {
                configRole(host, role, component, retryCount, callBack);
            },500);
        }
        else {
            console.log('exec ConfigRoleCmd , the cmd is ' + apiConfigRoleCmd);
            checkConfigRole(host, role, component, retryCount, callBack);
        }
    });
}
function checkConfigRole(host, role, component, retryCount, callBack) {
    var apiCheckConfigRoleCmd = '';
    if(component == 'hdfs' || component == 'mapreduce') {
        apiCheckConfigRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p hadoop -c initial';
    } 
    else {
        //unfinished
        apiCheckInstallRoleCmd = '';
    }
    exec(apiCheckConfigRoleCmd, function(err, stdout, stderr) {
        if(err) {
            retryCount++;
            console.log('this is the ' + retryCount + ' time retry.');
            setTimeout(function() {
                configRole(host, role, component, retryCount, callBack);
            },500); 
        }
        else {
            console.log('exec ConfigRoleCmd success, the cmd is ' + apiCheckConfigRoleCmd);
            callBack();
        }
    });
}

exports.generate = function generate(req, res, hostsRolesList, defaultConfig, component, callBack) {
    var comp = component;
    var generateConfigCmd = ''; 
    console.log('enter generate function');
    if(comp == 'hdfs')
        generateForHdfs(req, res, hostsRolesList, defaultConfig, component, callBack);
    else if(comp == 'mapreduce')
        generateForMapReduce(req, res, hostsRolesList, defaultConfig, component, callBack);
}
function generateForHdfs(req, res, hostsRolesList, defaultConfig, component, callBack) {
    var generateConfigCmd = 'sh /usr/local/NArk/sbin/hadoop/generate.sh hdfs ';
    for(var i = 0; i < hostsRolesList.length; i++) {
        if(hostsRolesList[i].role_name == 'namenode') {
            generateConfigCmd += hostsRolesList[i].host + ' ';
            break;
        }
    }
    for(var i = 0; i < hostsRolesList.length; i++) {
        if(hostsRolesList[i].role_name == 'secondarynamenode') {
            generateConfigCmd += hostsRolesList[i].host + ' ';
            break;
        }
    }
    var datanodeList = '';
    for(var i = 0; i < hostsRolesList.length; i++) {
        if(hostsRolesList[i].role_name == 'datanode') {
            datanodeList += hostsRolesList[i].host + ':';
        }
    }
    datanodeList = datanodeList.substring(0, datanodeList.length-1);
    generateConfigCmd += datanodeList + ' ';
    var nn_dir = req.body['namenode-directories']; 
    var snn_dir = req.body['secondarynamenode-directories']; 
    var dn_dir = req.body['datanode-directories'];
    generateConfigCmd += nn_dir + ' ' + snn_dir + ' ' + dn_dir;
    console.log('exec generateConfigCmd');
    exec(generateConfigCmd, function(err, stdout, stderr) {
        if(err) {
            console.log('err cmd is ' + generateConfigCmd);
            console.log(err);
        }
        else {
            countFlagForConfigRole = hostsRolesList.length;
            for(var i = 0; i < hostsRolesList.length; i++) {
                var host = hostsRolesList[i].host;
                var role = hostsRolesList[i].role_name; 
                configRole(host, role, component, 0, callBack);
            } 
        }
    });
}

function generateForMapReduce(req, res, hostsRolesList, defaultConfig, component, callBack) {
    var generateConfigCmd = 'sh /usr/local/NArk/sbin/hadoop/generate.sh mapreduce ';
    for(var i = 0; i < hostsRolesList.length; i++) {
        if(hostsRolesList[i].role_name == 'jobtracker') {
            generateConfigCmd += hostsRolesList[i].host;
            break;
        }
    }
    console.log('exec generateConfigCmd');
    exec(generateConfigCmd, function(err, stdout, stderr) {
        if(err) {
            console.log('err cmd is ' + generateConfigCmd);
            console.log(err);
        }
        else {
            countFlagForConfigRole = hostsRolesList.length;
            for(var i = 0; i < hostsRolesList.length; i++) {
                var host = hostsRolesList[i].host;
                var role = hostsRolesList[i].role_name; 
                configRole(host, role, component, 0, callBack);
            } 
        }
    });
}

exports.startRole = function startRole(req, res, host, role, component, retryCount, countFlag) {
	console.log(countFlag);
	console.log(countFlag.failed);
    if(retryCount == RETRY_MAX_COUNT) {
        console.log('host: ' + host + ', role: ' + role + ' startRole failed');
        (countFlag.failed)++;
        if(countFlag.failed == countFlag.total) {
            res.send(200, {error: 'exec start operation failed'});
        }
		return;
    }
    var comp = component;
    var apiStartRoleCmd = '';
    if(comp == 'mapreduce' || comp == 'hdfs') {
        apiStartRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+ host + ' hadoop ' + role + ' start'; 
    }
    else {
        apiStartRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+ host + ' ' + comp + ' ' + role + ' start'; 
    }
	console.log('the startRole cmd is ' + apiStartRoleCmd);
    exec(apiStartRoleCmd,function(err, stdout, stderr) {
        if(err) { 
			console.log('the err cmd is ' + apiStartRoleCmd);
            console.log(err);
			console.log('the err info is ' + stdout);
            retryCount++;
            console.log('this is the ' + retryCount + ' times retry.');
            setTimeout(function() {
                startRole(req, res, host, role, component, retryCount);
            },500);
        }
        else {
            checkStartRole(req, res, host, role, component, retryCount, countFlag);
        }
    });
}

function checkStartRole(req, res, host, role, component, retryCount, countFlag) { 
    var apiCheckStartRoleCmd = ''; 
    if(component == 'mapreduce' || component == 'hdfs') {
        apiCheckStartRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -s hadoop-' + role; 
    } 
    else {
             
    }
    exec(apiCheckStartRoleCmd, function(err, stdout, stderr) {
        if(err) {
			console.log('the err cmd is ' + apiCheckStartRoleCmd);
			console.log('the err info is ' + stdout);
            console.log(err);     
            retryCount++;
            console.log('this is the ' + retryCount + ' times retry.');
            setTimeout(function() {
                startRole(req, res, host, role, component, retryCount, countFlag);
            },500);
//            res.send(200, {error: 'exec start operation failed'});
        } 
        else {
            conn.query('update services_on_the_hosts_info set service_status = ? where host = ? and role_name = ?', ['health', host, role], function(err,result) {
                if(err) {
                    console.log(err);     
                } 
                else {
                    countFlag.success++;
                    if(countFlag.success == countFlag.total) {
                        res.send(200, {result: 'success'});     
                    }
                    else if(countFlag.success + countFlag.failed == countFlag.total) {
                        res.send(200, {error_info: 'some_failed'});     
                    }
                }
            }); 
        }
    });
}

exports.stopRole = function stopRole(req, res, host, role, component, retryCount, countFlag) {
    if(retryCount == RETRY_MAX_COUNT) {
        console.log('host: ' + host + ', role: ' + role + ' stopRole failed');
        countFlag.failed++;
        if(countFlag.failed == countFlag.total) {
            res.send(200, {error: 'exec stop operation failed'});
        }
		return;     
    }
    var comp = component;
    var apiStopRoleCmd = '';
    if(comp == 'mapreduce' || comp == 'hdfs') {
        apiStopRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop ' + role + ' stop'; 
    }
    else {
        apiStopRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' ' + comp + ' ' + role + ' stop'; 
    }
	console.log('the stopRole cmd is ' + apiStopRoleCmd);
    exec(apiStopRoleCmd,function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
            checkStopRole(req, res, host, role, comp, retryCount, countFlag);
        }
    });
}

function checkStopRole(req, res, host, role, component, retryCount, countFlag){
    var apiCheckStopRoleCmd = ''; 
    if(component == 'mapreduce' || component == 'hdfs') {
        apiCheckStopRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -s hadoop-' + role; 
    } 
    else {
             
    }
    exec(apiCheckStopRoleCmd, function(err, stdout, stderr) {
        if(err) {
            conn.query('update services_on_the_hosts_info set service_status = ? where host = ? and role_name = ?', ['dead', host, role], function(err,result) {
                if(err) {
                    console.log(err);     
                } 
                else {
                    countFlag.success++;
                    if(countFlag.success == countFlag.total) {
                        res.send(200, {result: 'success'});     
                    }
                    else if(countFlag.success + countFlag.failed == countFlag.total) {
                        res.send(200, {error_info: 'some_failed'});     
                    }
                }
            }); 
            
        } 
        else {
            retryCount++;
			console.log('the err cmd is ' + apiCheckStopRoleCmd);
			console.log('the err info is ' + stdout);
            console.log('this is the ' + retryCount + ' times retry.');
            setTimeout(function() {
                stopRole(req, res, host, role, component, retryCount, countFlag);
            },500);
        }
    });   
}

exports.uninstallRole = function uninstallRole(req, res, host, role, component, callBack) {
    var comp = component;
    var apiUninstallRoleCmd = '';
    if(comp == 'mapreduce' || comp == 'hdfs') {
        apiUninstallRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop ' + role_name + ' uninstall'; 
    }
    else {
        apiUninstallRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' ' + comp + ' ' + role_name + ' uninstall'; 
    }
    exec(apiUninstallRoleCmd,function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
			checkUninstallRole(req, res, host, role, component, callBack);
        }
    });
}

function checkUninstallRole(req, res, host, role, component, callBack) {
	var remove_check_cmd = '';
	if(component == 'hdfs' || component == 'mapreduce') {
		remove_check_cmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p hadoop';
	}
	else {
		remove_check_cmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p ' + component;
	}
	exec(remove_check_cmd, function(err, stdout, stderr) {
		if(err) {
			console.log('remove_check_cmd success, the cmd is ' + remove_check_cmd);
			conn.query('delete from services_on_the_hosts_info where host = ? and role_name = ?', [host, role], function(err, result) {
				if(err) {
					console.log(err);	
				}		
				else {
					var defaultConfig = '';
					var hostRoleLists = [];
					step (
						function() {
							var group = this.group();	
							conn.query('select current_config from services_on_running where service_name = ?', service, group());	
						},
						function(err, result) {
							if(err) {
								console.log(err);	
								return;
								throw err;
							}
							else {
								var group = this.group();
								conn.query('select host, role_name from services_on_the_hosts_info where service_name = ?', component, group());							
							}
						},
						function(err, result) {
							if(err) {
								console.log(err);	
								return;
							}	
							else {
								var group = this.group();	
								currentConfig = result[0].current_config;
								var roleConfigArr = currentConfig.split(';');
								for(var i = 0; i < roleConfigArr.length; i++) {
									if(roleConfigArr[i].length == 0)
										continue;
									var roleConfig = roleConfigArr[i].split(':')[1];
									var roleName = roleConfigArr[i].split(':')[0];
									newConfig += roleName+':'; 
									var specificConfigArr = roleConfig.split(',');
									for( var j = 0; j < specificConfigArr.length; j++) {
										if(specificConfigArr[j].length == 0)
											continue;
										var specificConfigName = specificConfigArr[j].split('^')[0];
										var specificConfig = specificConfigArr[j].split('^')[1];

										req.body[specificConfigName] = specificConfig; 
									}
								}	
								generate(req, res, result, default_config, service, callBack());
							}
						}
					);
				}
			});
		}		
		else {
			console.log('remove_check_cmd failed, the cmd is ' + remove_check_cmd);	
			console.log('the err info is ' + stdout);
		}
	});
}

exports.configRole = configRole;
