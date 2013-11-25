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

function installRole(host, role, component, callBack) {
    var comp=component;
    var apiInstallRoleCmd = '';
    if(comp == 'hdfs' || comp == 'mapreduce')
        apiInstallRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop '+ role + ' install';
    else
        apiInstallRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' '+ comp +' '+ role + ' install';
    exec(apiInstallRoleCmd, function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
            checkInstallRole(host,role,component,callBack);
        }
    }); 
}

function checkInstallRole(host, role, component, callBack) {
    var comp = component;
    var apiCheckInstallRoleCmd = '';
    if(comp == 'hdfs' || comp == 'mapreduce') {
        apiCheckInstallRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p hadoop';
    }
    else {
        apiCheckInstallRoleCmd = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -p ' + comp;
    }
    exec(apiCheckInstallRoleCmd, function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
            callBack(); 
        }
    });

}

function configRole(host, role, component, callBack) {
    var comp = component;
    var apiConfigRoleCmd = '';
    if(comp == 'hdfs' || comp == 'mapreduce')
        apiConfigRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP ' + host + ' hadoop ' + role + ' config';
    else
        apiConfigRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+host+' ' + comp + ' ' + role + ' config';
    exec(apiConfigRoleCmd, function(err, stdout, stderr) {
        if(err) {
            console.log(err);
        }
        else {
            callBack(); 
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
        apiStartRoleCmd = 'sh /usr/local/NArk/uppershell/bin/DPOP '+ host + ' ' comp + ' ' + role + ' start'; 
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

function generate(component, callBack) {
    var comp = component;
    var generate_cmd = ''; 
    if(comp == 'mapreduce' || comp == 'hdfs')
        generate_cmd = 'sh /usr/local/NArk/sbin/hadoop/generate.sh ';
    else
        generate_cmd = 'sh /usr/local/NArk/sbin/' + comp + '/generate.sh '; 
    generate_cmd += comp;
    
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

exports.select_hosts_for_service = function(req,res){ 
    var service = req.session.Service;
    var count = 0;
    var countFlag = 0;
    console.log(req.body);
    console.log(JSON.stringify(req.body)); 
    conn.query('select role_name from services_can_be_installed where service_name=?', [service], function(err,result) {
        if(err) {
            console.log(err); 
        }
        else {
            var roleNameArr = (result[0]['role_name']).split(",");
            var roleNameArrLen = roleNameArr.length;
            if(roleNameArrLen == 0) {
                console.log('no service role error');
                return;
            }
            for(var j=0; j<roleNameArrLen; j++){
                var roleHostList = req.body['hostslist_' + roleNameArr[j]]; 
                if(typeof roleHostList == 'string') {
                    countFlag++;   
                    var roleHostPair = roleHostList.split(',');
                    var role = roleHostPair[0];
                    var host = roleHostList[1]; 
                    installRole(host, role, service,); 
                }
            } 
        }
    });
}

