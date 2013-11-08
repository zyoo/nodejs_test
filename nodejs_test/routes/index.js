
/*
 * GET home page.
 */
var mysql=require('mysql');
var exec=require('child_process').exec;
var conn=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager',
    port:3306
});

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
exports.index = function(req,res){
    res.render('index',{title: 'Index'});
}
exports.login = function(req,res){
    console.log("open the login page");
    res.render('login',{title: 'user login'});
}
exports.doLogin = function(req,res){
    var user={
        username:'admin',
        password:'admin'
    }
    if(req.body.username===user.username && req.body.password===user.password){
        res.redirect('/home'); 
    }
    res.redirect('/login');
}
exports.logout=function(req,res){
    res.redirect('/');
}
exports.home=function(req,res){
    var user={
        username:'admin',
        password:'admin'
    }
    res.render('home',{title:'Home',user:user});
}
exports.server=function(req,res){
    conn.query("select * from host_info",function(err,result){
            if(err){
                console.log(err);
                res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'database option failed',DataBase_Res:''});
            }
            else{
                var count=0;
                for(var i=0;i<result.length;i++){
                    if(result[i]['host'] == ''){
                        console.log(result[i]);
                        continue;
                    }
                    console.log(result[i]['host']);
                    conn.query("select host,role_name from services_on_the_hosts_info where host='"+result[i]['host']+"'",function(host_number,total_info){
                        return function(err,result){
                            count++;
                            if(err){
                                console.log(err);
                            }
                            else{
                                console.log(result); 
                                console.log(typeof result);
                                if(result.length == 0)
                                    total_info[host_number]['role_name']='';
                                else
                                    total_info[host_number]['role_name']=result[0]['role_name'];
                                for(var j=1;j<result.length;j++){
                                    total_info[host_number]['role_name']=total_info[host_number]['role_name']+','+result[j]['role_name'];
                                }
                                console.log(total_info[host_number]);
                                if(count ==total_info.length){
                                    var str_result=JSON.stringify(total_info);
                                    var str_result1=str_result.replace(/"/g,'\"');
                                    res.render('server',{title:'Server',flag:'false',CheckRes:'',DataBase_Res:str_result1});

                                }
                            }
                        };
                    }(i,result) );
                }

            }
    });
}

exports.add_server_first=function(req,res){
    var host=req.body.machine_host;
    var port=req.body.machine_port;
    var file=req.body.files;
    if(host == null || port == null || file == null)
        res.render('server',{title:'Service:Add New Server',flag:'true',CheckRes:'the input info is illegal',DataBase_Res:''});
    else{
        console.log("the machine host and port is "+host+":"+port);
        console.log(req.body);
       //here is the code which check the host is illegal or not. 
        var api_checkhost_cmd='sh check '+host;
        exec(api_checkhost_cmd,function(err,stdout,stderr){
                if(err == null){
                // get the base info of the host from yanqiang's api name:host -a:add server;-g get info.
                var api_gethostinfo_cmd='sh host -g '+host+'-p '+port+'-k '+file;
                exec(api_gethostinfo_cmd,function(err,stdout,stderr){
                    if(err){
                        res.render('server',{title:'Server:Add new server',flag:'true',CheckRes:'get the host info error',DataBase_Res:''}); 
                    }
                    else{
                    //here process the api result
                    conn.query("insert host_info set host=?,ip=?,cpu=?,ram=?,disk=?,os=?,load_info=?",[host,'192.168.1.222','16','2g','32g','centos5','20%'],function(err,result){
                        if(err){
                            console.log('the err is \n');
                            console.log(typeof err);
                            res.render('server',{title:'Service:Add New Server',flag:'true',CheckRes:'update the database failed',DataBase_Res:''});
                            }
                        else{
                            res.render('server',{title:'Service:Add New Server',flag:'true',CheckRes:'the host is legal,please go on to add the server to the cluser',DataBase_Res:''});
                        //call the api from xiaoqiang to install the nagios and other base service
                            }
                        });                   
                    } 
                    });
                 }
                else{
                    res.render('server',{title:"Server:Add New Server",CheckRes:'the input info is illegal',DataBase_Res:''});
                }               
        });
    }
}

//function install_base_service(arg1,arg2,callback)
exports.add_server_second=function(req,res){
    var host=req.body.machine_host;
    var port=req.body.machine_port;
    var file=req.body.files;
    var but_value=req.body.SecondNext;
    if(but_value=="true"){
        //call the api from xiaoqiang to install the nagios and other base service        
        var api_addhost_cmd='sh host -a '+host+'-p '+port+'-k '+file;
        exec(api_addhost_cmd,function(err,stdout,stderr){
            if(err){
                res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:stdout,DataBase_Res:''});
            }
            else{
                conn.query("select * from host_info",function(err,result){
                    if(err){
                        console.log(err);
                        res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'database option failed',DataBase_Res:''});
                    }
                    else{
                        var count=0;
                        for(var i=0;i<result.length;i++){
                            if(result[i]['host'] == ''){
                                console.log(result[i]);
                                continue;
                            }
                            console.log(result[i]['host']);
                            conn.query("select host,role_name from services_on_the_hosts_info where host='"+result[i]['host']+"'",function(host_number,total_info){
                                return function(err,result){
                                    count++;
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        console.log(result); 
                                        console.log(typeof result);
                                        if(result.length == 0)
                                            total_info[host_number]['role_name']='';
                                        else
                                            total_info[host_number]['role_name']=result[0]['role_name'];
                                        for(var j=1;j<result.length;j++){
                                            total_info[host_number]['role_name']=total_info[host_number]['role_name']+','+result[j]['role_name'];
                                        }
                                        console.log(total_info[host_number]);
                                        if(count ==total_info.length){
                                            var str_result=JSON.stringify(total_info);
                                            var str_result1=str_result.replace(/"/g,'\"');
                                            res.render('server',{title:'Server',flag:'false',CheckRes:'',DataBase_Res:str_result1});

                                        }
                                   }
                                };
                            }(i,result) );
                        }
               
                    }
                });
            } 
        });
    }
}
exports.show_server_list=function(req,res){

}
