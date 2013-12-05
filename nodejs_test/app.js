
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var service = require('./routes/service');
var service_new = require('./routes/service_new');
var server_new = require('./routes/server_new');
var http = require('http');
var path = require('path');
var ejs = require('ejs');

var mysql1 = require('mysql');
var exec = require('child_process').exec;
var conn1 = mysql1.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager_dev',
    port:3306
});
var RETRY_MAX_COUNT = 3; 
function update_one_host_info(host, file_path, port, retryCount)
{
	if(retryCount == RETRY_MAX_COUNT) {
		console.log(err); 
		conn1.query('update host_info set status = ? where host = ?', ['dead', host], function(err, result) {
			if(err) {
				console.log(err);
			}
		});		
	}
    var list_host_info_res = [];
    var api_gethostinfo_cmd='sh HOST -g ' + host + ' -p ' + port + ' -k ' + file_path;
    exec(api_gethostinfo_cmd, function(err, stdout, stderr) {
           if(err) {
				retryCount++;
				setTimeout(function() {
					update_one_host_info(host, file_path, port, retryCount);
				},500);
           } 
           else {
                console.log(api_gethostinfo_cmd+' success');
                var host_info_res = stdout;
                var arr_host_info_res = new Array();
                arr_host_info_res = host_info_res.split(";");
                for(var m = 0; m<arr_host_info_res.length; m++) {
                    var temp_arr = new Array();
                    temp_arr = (arr_host_info_res[m]).split(":");
                    if(temp_arr[1].indexOf('\n') != -1)
                        temp_arr[1] = temp_arr[1].substr(0, temp_arr[1].indexOf('\n'));
                    list_host_info_res[temp_arr[0]] = temp_arr[1];
                    console.log(temp_arr[0]);
                }

                conn1.query('update host_info set load_info = ? where host = ?', [list_host_info_res['load'], host], function(err, result) {
                    if(err) {
                        console.log(err); 
                    }
                }); 
           }
    }); 
}
function update_host_info()
{
    conn1.query('select host, port, key_file_path from host_info', function(err, result) {
        if(err) {
            console.log(err); 
        }
        else {
            for(var i = 0; i < result.length; i++) {
                update_one_host_info(result[i]['host'], result[i]['key_file_path'], result[i]['port'], 0); 
            }
        }
            
    });    
}

function update_one_host_service_info(host, role_name) {
    api_checkonenodeservice_status = 'sh /usr/local/NArk/bin/CHECK -h ' + host + ' -s hadoop-' + role_name;
    exec(api_checkonenodeservice_status, function(err, stdout, stderr) {
        if(err) {
            conn1.query('update services_on_the_hosts_info set service_status = ? where host = ? and role_name = ?', ['dead', host, role_name], function(err, result) {
                if(err) {
                    console.log(err);
                }
            });
        }
        else {
            conn1.query('update services_on_the_hosts_info set service_status = ? where host = ? and role_name = ?', ['health', host, role_name], function(err, result) {
                if(err) {
                    console.log(err);
                }

            });

        }

    }); 
}

function update_service_status() {
    conn1.query('select host, role_name from services_on_the_hosts_info', function(err, result) {
        if(err) {
            console.log(err);
        }
        else {
            for(var i = 0; i < result.length; i++) {
                update_one_host_service_info(result[i]['host'], result[i]['role_name']);
            }
        }

    });
}

// update host info table every a minute
setInterval(update_host_info, 10*60*1000);
// update services status every 30 seconds;
setInterval(function() {update_service_status();}, 5*60*1000);

var app = express();

// all environments
app.set('port', process.env.PORT || 81);
app.set('views', path.join(__dirname, 'views'));
app.engine('.html',ejs.__express);
app.set('view engine','html');
//app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({keepExtensions:true,uploadDir:'./temp_keyfile_dir'}));
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser('sctalk admin manager'));            
app.use(express.cookieSession());
app.use(express.session({secret:'123456789'}));
app.use(app.router);

app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.login);
app.get('/login', routes.login);
app.post('/dologin', routes.doLogin);
app.post('/dologout', routes.authorize, routes.dologout);
app.get('/monitor', routes.monitor);

app.get('/service',routes.authorize,service.show_service);
app.post('/service/select_service',routes.authorize,service.select_service);
app.post('/service/select_hosts_for_service', routes.authorize, service_new.selectHostsForService);
app.post('/service/modify_config',routes.authorize,service_new.modifyConfig);
app.post('/service/get_info',routes.authorize,service.get_info);
app.post('/service/get_config',routes.authorize,service.get_config);
app.post('/service/get_action',routes.authorize,service.get_action);
app.post('/service/add_new_node',routes.authorize,service.add_new_node);
//app.post('/service/start_all_nodes',routes.authorize,service.start_all_nodes);
//app.post('/service/stop_all_nodes',routes.authorize,service.stop_all_nodes);
//app.post('/service/start_node',routes.authorize,service.start_node);
//app.post('/service/stop_node',routes.authorize,service.stop_node);
app.post('/service/start_all_nodes',routes.authorize,service_new.startAllNodes);
app.post('/service/stop_all_nodes',routes.authorize,service_new.stopAllNodes);
app.post('/service/start_node',routes.authorize,service_new.startNode);
app.post('/service/stop_node',routes.authorize,service_new.stopNode);
app.post('/service/select_new_node',routes.authorize,service.select_new_node);
app.post('/service/install_for_newnodes',routes.authorize,service_new.installForNewNodes);

//app.post('/service/remove_service', routes.authorize, service.removeService);

app.get('/server/update',routes.authorize,routes.server_info_update);
app.get('/server',routes.authorize,routes.server);
app.post('/server/add_server_check',routes.authorize, routes.authorize_admin_for_form, routes.add_server_first);
app.post('/server/add_server_add',routes.authorize,routes.add_server_second);
app.get('/server/update_remove_server',routes.authorize,routes.update_remove_server);
app.post('/server/remove_server',routes.authorize,routes.remove_server);
app.post('/server/get_host_info', routes.authorize, server_new.getHostInfo);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
