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
var RETRY_MAX_COUNT = 3;

var countForInstallRole = 0;
var countFlagForInstallRole = 0;

var countForConfigRole = 0;
var countFlagForConfigRole = 0;

function installRole(host, role, component, retryCount, callBack) {
    if(retryCount == RETRY_MAX_COUNT) {
        console.log('host: ' + host + '; role: ' + role + ' install failed after ' + retryCount + ' retry install');
        
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

function callBackForInstallRole(req, res, host, role, service) {
    return function(){ 
            conn.query('delete from services_on_the_hosts_info_temp where host = ? and role_name = ?', [host, role], function(err, result) {
                if(err) {
                    console.log(err);
                }
                else {
                    conn.query('insert into services_on_the_hosts_info_temp set host = ?, role_name = ?, service_name = ?', [host, role, service], function(err, result) {
                        if(err) {
                            console.log(err);
                            res.render('service',
                                        {title:'Service:Select Service',
                                         Flag:'false',
                                         Components:'',
                                         HostList:'',
                                         Unique_Flag:'',
                                         Config:'',
                                         err_info:'insert into services_on_the_hosts_info_temp error'
                                         });
                        }
                        else {
                            countForInstallRole++;
                            if(countForInstallRole == countFlagForInstallRole) {
                                conn.query('select service_name, role_name, default_config from services_can_be_installed where service_name = ?', [service], function(err, result) {
                                    if(err) {
                                        console.log(err);
                                        res.render('service',
                                                    {title:'Service:Select Service',
                                                     Flag:'false',
                                                     Components:'',
                                                     HostList:'',
                                                     Unique_Flag:'',
                                                     Config:'',
                                                     err_info:'get default_config failed'
                                                     });
                                    }
                                    else {
                                        var configInfo = JSON.stringify(result);
                                        res.render('service',
                                                   {title:'Service:Select Service',
                                                    Flag:'true',
                                                    Components:'',
                                                    HostList:'',
                                                    Unique_Flag:'',
                                                    Config:configInfo,
                                                    err_info:''
                                                    });
                                    }
                                });
                            }
                        }
                        
                    });
                }
            });
        }
}

function configRole(host, role, component, retryCount, callBack) {
    if(retryCount == RETRY_MAX_COUNT) {
        console.log(err);
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
            callBack();
        }
    });
}
function callBackForConfigRole(req, res, host, role, service) {
    return function(){
            countForConfigRole++; 
            if(countForConfigRole == countFlagForConfigRole) {
                var newConfig = '';
                var roleNameList = result[0].role_name;
                var config = result[0].default_config;
                var roleConfigArr = config.split(';');
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
                        var specificConfigName = specificConfigArr[j].split('^');
                        var specificConfig = req.body[specificConfigName]; 
                        newConfig += specificConfigName + '^' + specificConfig + ',';
                    }
                    newConfig += ';';
                }
                conn.query('select * from services_on_running where service_name = ?', [service], function(err,result) {
                    if(err) {
                        console.log(err);     
                    } 
                    else {
                        var updateConfigSqlCmd = '';
                        if(result.length == 0) 
                            updateConfigSqlCmd = 'insert into services_on_running set current_config = "' + newConfig + '", service_name = "' + service + '", role_name = "' + roleNameList + '"';
                        else
                            updateConfigSqlCmd = 'update services_on_running set current_config = "' + newConfig + '" where service_name = "' + service + '"';
                        conn.query(updateConfigSqlCmd, function(err,result) {
                            if(err) {
                                console.log(err);     
                            }     
                            else {
                                conn.query('select host, role_name, service_status from services_on_the_hosts_info_temp where service_name = ?', [service], function(err, result) {
                                    if(err) {
                                        console.log(err);     
                                    } 
                                    else {
                                        var hostRoleInfo = result; 
                                        var count = 0;
                                        for(var i = 0; i < hostRoleInfo.length; i++) {
                                            conn.query('select * from services_on_the_hosts_info where host = ? and role_name = ?', [hostRoleInfo[i].host, hostRoleInfo[i].role_name], function(host, role){
                                                return function(err,result) {
                                                    if(err){
                                                        console.log(err);
                                                        return;     
                                                    } 
                                                    else {
                                                        var sqlCmd1 = '';
                                                        if(result.length == 0){
                                                            sqlCmd1 = 'insert into services_on_the_hosts_info set host = "' + host + '", role_name = "' + role + '", service_status = "dead", service_name = "' + service + '"'; 
                                                            conn.query(sqlCmd1, function(err,result) {
                                                                if(err) {
                                                                    console.log(err);     
                                                                    return;
                                                                }     
                                                                else {
                                                                    count++;
                                                                    if(count == hostRoleInfo.length){
                                                                        res.redirect('/service');     
                                                                    }     
                                                                }
                                                            });
                                                        } 
                                                    }
                                                }; 
                                            }(hostRoleInfo[i].host, hostRoleInfo[i].role_name)); 
                                        }
                                    }
                                }); 
                                     
                            }
                        });
                    }
                });
            }
        };
}

function generate(req, res, hostsRolesList, defaultConfig, component, callBack) {
    var comp = component;
    var generateConfigCmd = ''; 
    if(comp == 'hdfs')
        generateForHdfs(req, res, hostsRolesList, defaultConfig, component, callBack);
    else if(comp == 'mapreduce')
        generateForMapReduce(req, res, hostsRolesList, defaultConfig, component, callBack);
    else
        console.log(err); 
}
function generateForHdfs(hostsRolesList, defaultConfig, component, callBack) {
    var generateConfigCmd = 'sh /usr/local/NArk/sbin/hadoop/generate.sh ';
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
            datanodeList += hostsRolesList[i].host + ' ';
        }
    }
    datanodeList = datanodeList.substring(0, datanodeList.length-1);
    generateConfigCmd += datanodeList + ' ';
    var nn_dir = req.body['namenode-directories']; 
    var snn_dir = req.body['secondarynamenode-directories']; 
    var dn_dir = req.body['datanode-directories'];
    generateConfigCmd += nn_dir + ' ' + snn_dir + ' ' + dn_dir;
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
                configRole(host, role, component, callBack);
            } 
        }
    });
}

function startRole(host, role, component, callBack) {
    var comp = component;
    var apiStartRoleCmd = '';
    if(comp == 'mapreduce' || comp == 'hdfs') {
        apiStartRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+ host + ' hadoop ' + role + ' start'; 
    }
    else {
        apiStartRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+ host + ' ' + comp + ' ' + role + ' start'; 
    }
    exec(apiStartRoleCmd,function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
            callBack();
        }
    });
}

function stopRole(host, role, component, callBack) {
    var comp = component;
    var apiStopRoleCmd = '';
    if(comp == 'mapreduce' || comp == 'hdfs') {
        apiStopRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop ' + role_name + ' stop'; 
    }
    else {
        apiStopRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' ' + comp + ' ' + role_name + ' stop'; 
    }
    exec(apiStopRoleCmd,function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
            callBack();
        }
    });
}

function uninstallRole(host, role, component, callBack) {
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
            callBack();
        }
    });
}



exports.select_service = function(req, res) {
    console.log('the serviceChoice radio is '+req.body.serviceChoice);
    var serviceChoice=req.body.serviceChoice;
    conn.query('select * from services_on_running where service_name=?', [serviceChoice], function(err, result) {
        if(err) {
            console.log(err);
        }
        else {
            if(result.length != 0) {
                res.render('service', {title:'Service:Select Service', Flag:'false', Components:'', HostList:'', Unique_Flag:'', Config:'', err_info:'the service has been installed'});
            }
            else {
                conn.query('select role_name from services_can_be_installed where service_name=?', [serviceChoice], function(err, result){
                    var flag = 'true';
                    if(err) {
                        console.log(err); 
                        flag = 'false';
                    }
                    else {
                        var roleName = result[0]['role_name'];
                        req.session.Service = serviceChoice;
                         conn.query('select host from host_info', function(err, result) {
                            if(err) {
                                console.log(err); 
                                res.render('service', {title:'Service:Select Service', Flag:'false', Components:'', HostList:'', Unique_Flag:'', Config:'', err_info:'select host failed'});//should be modified
                            }      
                            else {
                                var str_host_list = JSON.stringify(result);
                                console.log(result);
                                console.log(str_host_list);
                                  
                                conn.query('select role_name, unique_flag from role_unique where service_name=?', [serviceChoice], function(err, result) {
                                    if(err) {
                                        console.log(err); 
                                    }
                                    else {
                                        var str_res = JSON.stringify(result); 
                                        res.render('service', {title:'Service:Select Service', Flag:'true', Components:roleName, HostList:str_host_list, Unique_Flag:str_res, Config:'', err_info:''});
                                    }
                                });
                            } 
                        });                   
                    }
                });
            }
        }
    });
} 

exports.selectHostsForService = function(req, res) { 
    var service = req.session.Service;
    console.log('enter selectHostsForService');
    console.log('the service is ' + service);
    console.log('the user is ' + req.session.username);
    console.log(req.body);
    conn.query('select role_name from services_can_be_installed where service_name=?', [service], function(err,result) {
        if(err) {
            console.log(err); 
        }
        else {
            console.log(result);
            var roleNameArr = (result[0]['role_name']).split(",");
            var roleNameArrLen = roleNameArr.length;
            if(roleNameArrLen == 0) {
                console.log('no service role error');
                return;
            }
            for(var j=0; j<roleNameArrLen; j++){
                var roleHostList = req.body['hostslist_' + roleNameArr[j]]; 
                if(typeof roleHostList == 'string') {
                    countFlagForInstallRole++;   
                    var roleHostPair = roleHostList.split(',');
                    console.log(roleHostPair);
                    var role = roleHostPair[0];
                    var host = roleHostPair[1]; 
                    installRole(host, role, service, 0, callBackForInstallRole(req, res, host, role, service));
                    
                }
                else {
                    for(var hostRole in roleHostList) {
                        countFlagForInstallRole++;
                        var arrHost = roleHostList[hostRole].split(',');
                        console.log(arrHost);
                        var role = arrHost[0];
                        var host = arrHost[1];
                        installRole(host, role, service, 0, callBackForInstallRole(req, res, host, role, service));
                    }
                }
            } 
        }
    });
}

exports.modifyConfig = function(req, res) {
    var service = req.session.Service;
    conn.query('select default_config from services_can_be_installed where service_name = ?', [service], function(err, result) {
        if(err) {
            console.log(err);
            res.render('service', 
                        {title:'Service:Select Service',
                         Flag:'false',
                         Components:'',
                         HostList:'',
                         Unique_Flag:'',
                         Config:'',
                         err_info:'modify config failed'
                        });
        }
        else {
            var default_config = result[0]['default_config'];
            conn.query('select host, role_name from services_on_the_hosts_info_temp where service_name = ?', [service], function(err,result) {
                generate(result, default_config, callBackForModifyConfig(req, res));
            }); 
        }
    }); 
}
