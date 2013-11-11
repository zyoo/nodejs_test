
/*
 * GET home page.
 */
var fs=require('fs');
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
    conn.query("select host,ip,cpu,ram,disk,os,load_info,status from host_info",function(err,result){
            if(err){
                console.log(err);
                res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'database option failed',DataBase_Res:'',host_arg:''});
            }
            else{
                var count=0;
                for(var i=0;i<result.length;i++){
                    if(result[i]['host'] == ''){
//                        console.log(result[i]);
                        continue;
                    }
 //                   console.log(result[i]['host']);
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
                                    res.render('server',{title:'Server',flag:'false',CheckRes:'',DataBase_Res:str_result1,host_arg:''});

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
    var file=req.body.keyfile;
    console.log(req.body);
    console.log(JSON.stringify(req.body));
    req.session.machine_host=host;
    req.session.machine_port=port;
//    console.log(req.files.files[0]);
    if(host == null || port == null){
        console.log("hello world");
        res.render('server',{title:'Service:Add New Server',flag:'true',CheckRes:'the input info is illegal',DataBase_Res:''});
    }
    else{
        var current_path=process.cwd();
        var new_path=current_path+'/keyfile_dir/'+host+'.keyfile.list';
        console.log(new_path);
//        console.log(file);
        fs.renameSync(req.files.keyfile.path,new_path);
        fs.chmodSync(new_path,'600');
        console.log("the machine host and port is "+host+":"+port);
       //here is the code which check the host is illegal or not. 
        var api_checkhost_cmd='ping -c 5 '+host;
        exec(api_checkhost_cmd,function(err,stdout,stderr){
                if(err == null){
                    // get the base info of the host from yanqiang's api name:host -a:add server;-g get info.
                    console.log(api_checkhost_cmd+' success');
                    var api_gethostinfo_cmd='sh HOST -g '+host+' -p '+port+' -k '+new_path;
                    exec(api_gethostinfo_cmd,function(err,stdout,stderr){
                        if(err){
				console.log('api_gethostinfo_cmd failed');
				console.log(err);
                            res.render('server',{title:'Server:Add new server',flag:'true',CheckRes:'get the host info error:'+stdout+'.please cancle the operation',DataBase_Res:'',host_arg:''}); 
                        }
                        else{
			    console.log(api_gethostinfo_cmd+' success');
                            var host_info_res=stdout;
                            var arr_host_info_res=new Array();
                            arr_host_info_res=host_info_res.split(";");
                            var list_host_info_res=[];
                            for(var m=0;m<arr_host_info_res.length;m++){
                                var temp_arr=new Array();
//				console.log(arr_host_info_res[m]);
                                temp_arr=(arr_host_info_res[m]).split(":");
				if(temp_arr[1].indexOf('\n') != -1)
					temp_arr[1]=temp_arr[1].substr(0,temp_arr[1].indexOf('\n'));
                                list_host_info_res[temp_arr[0]]=temp_arr[1];
				console.log(temp_arr[0]);
//				console.log(temp_arr[1]);
//				console.log(list_host_info_res[temp_arr[0]]);
                            }
                            //here process the api result
//                            conn.query("delete from host_info_temp where host=?;insert into host_info_temp set host=?,ip=?,cpu=?,ram=?,disk=?,os=?,load_info=?",[host,host,list_host_info_res['ip'],list_host_info_res['cpu'],list_host_info_res['ram'],list_host_info_res['disk'],list_host_info_res['os'],list_host_info_res['load_info']],function(err,result){
                            conn.query("delete from host_info_temp where host=?",[host],function(err,result){
				if(err){

				}
				else{
				    conn.query("insert into host_info_temp set host=?,ip=?,cpu=?,ram=?,disk=?,os=?,load_info=?,key_file_path=?,port=?,status=?",[host,'xxx.xxx.xxx.xxx',list_host_info_res['cpu'],list_host_info_res['ram'],list_host_info_res['disk'],'centos5','20%',new_path,port,'live'],function(err,result){
					if(err){
					    console.log('the err is \n');
					    console.log( err);
					    res.render('server',{title:'Service:Add New Server',flag:'true',CheckRes:'update the database failed',DataBase_Res:'',host_arg:''});
					}
					else{
					    
					    res.render('server',{title:'Service:Add New Server',flag:'true',CheckRes:'the host is legal,please go on to add the server to the cluser',DataBase_Res:'',host_arg:host});
					//call the api from xiaoqiang to install the nagios and other base service
					}
				    }); 

				}
			    });
                        } 
                    });
                }
                else{
			console.log(err);
                    res.render('server',{title:"Server:Add New Server",flag:'true',CheckRes:'the input info for the host is illegal,the check err is '+JSON.stringify(err)+stdout+'. please check the host info,then try again',DataBase_Res:'',host_arg:''});
                }               
        });
    }
}

//function install_base_service(arg1,arg2,callback)
exports.add_server_second=function(req,res){
//    var host=req.body.machine_host1;
//    var port=req.body.machine_port1;
    var host=req.session.machine_host;
    var port=req.session.machine_port;
    var but_value=req.body.SecondNext;

    if(but_value=="true"){
        //call the api from xiaoqiang to install the nagios and other base service        
        var current_path=process.cwd();
        var new_path=current_path+'/keyfile_dir/'+host+'.keyfile.list';
        var api_addhost_cmd='sh HOST -a '+host+' -p '+port+' -k '+new_path;
	console.log(api_addhost_cmd);
        exec(api_addhost_cmd,function(err,stdout,stderr){
            if(err){
		console.log('api_addhost_cmd failed');
		console.log(err);
                res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'add host failed,the error info is '+JSON.stringify(err)+stdout,DataBase_Res:'',host_arg:''});
            }
            else{
		console.log(api_addhost_cmd+' success');
//                var result=stdout;
 //               var arr_info=result.split(";");
                conn.query("insert into host_info select * from host_info_temp where host=?",[host],function(err,result){
			if(err){
				console.log("insert host_info from host_info_temp failed");
				console.log(err);
				res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'add host failed,the error info is '+JSON.stringify(err),DataBase_Res:'',host_arg:''});
			}
			else{
				conn.query("delete from host_info_temp where host=?",[host],function(err,result){
				     if(err){
					 res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'add host failed,the error info is '+JSON.stringify(err)+stdout,DataBase_Res:'',host_arg:''});
				     }
				     else{
					 conn.query("select host,ip,cpu,ram,disk,os,load_info,status from host_info",function(err,result){
					    if(err){
						console.log(err);
						res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'database option failed',DataBase_Res:'',host_arg:''});
					    }
					    else{
						var count=0;
						for(var i=0;i<result.length;i++){
						    if(result[i]['host'] == ''){
							console.log(result[i]);
							continue;
						    }
						    console.log(result[i]['host']);
						    conn.query("select host,role_name from services_on_the_hosts_info where host=?",[result[i]['host']],function(host_number,total_info){
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
									console.log(str_result1);
								    res.render('server',{title:'Server',flag:'false',CheckRes:'',DataBase_Res:str_result1,host_arg:''});

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
		});


            } 
        });
    }
}
exports.show_server_list=function(req,res){

}
