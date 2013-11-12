
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var service=require('./routes/service');
var http = require('http');
var path = require('path');
var ejs = require('ejs');

var mysql1=require('mysql');
var exec=require('child_process').exec;
var conn1=mysql1.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager',
    port:3306
});

function update_one_host_info(host,file_path,port)
{
    var api_gethostinfo_cmd='sh host -g '+host+' -p '+port+' -k '+file_path;
    exec(api_gethostinfo_cmd,function(err,stdout,stderr){
           if(err){
                console.log(err); 
           } 
           else{
                var value=stdout['load'];         
                conn1.query('update host_info set load=? where host=?',[value,host],function(err,result){
                    if(err){
                        console.log(err); 
                    }
                }); 
           }
    }); 
}
function update_host_info()
{
    conn1.query('select host,port,file_path from host_info',function(err,result){
        if(err){
            console.log(err); 
        }
        else{
            for(var i=0;i<result.length;i++){
                update_one_host_info(result[i]['host'],result[i]['file_path'],result[i]['port']); 
            }
        }
            
    });    
}

// update host info table every a minute
//setInterval(update_host_info,60*1000);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.html',ejs.__express);
app.set('view engine','html');
//app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({keepExtensions:true,uploadDir:'./temp_keyfile_dir'}));
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());            
//app.use(express.cookieSession());
app.use(express.session({secret:'123456789'}));
app.use(app.router);

app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/login', routes.login);
app.post('/login',routes.doLogin);
app.get('/logout',routes.logout);
app.get('/home',routes.home);


app.get('/service',service.show_service);
app.post('/service/select_service',service.select_service);
app.post('/service/select_hosts_for_service',service.select_hosts_for_service);
app.post('/service/modify_config',service.modify_config);
app.post('/service/get_info',service.get_info);
app.post('/service/get_config',service.get_config);
app.post('/service/get_action',service.get_action);
app.post('/service/add_new_node',service.add_new_node);
app.post('/service/start_all_nodes',service.start_all_nodes);
app.post('/service/stop_all_nodes',service.stop_all_nodes);
app.post('/service/start_node',service.start_node);
app.post('/service/stop_node',service.stop_node);

app.get('/server',routes.server);
app.post('/server/add_server_check',routes.add_server_first);
app.post('/server/add_server_add',routes.add_server_second);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
