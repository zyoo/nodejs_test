var mysql=require('mysql');
var exec=require('child_process').exec;
var conn=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager_dev',
    port:3306
});
var sleep=require('sleep');
/*
here is the show service list functions,such as get info,get config,get action,add new node,start all ,stop all and so on
*/
exports.show_service=function(req,res){
    console.log('the request is '+req.body);
    conn.query('select service_name from services_on_running',function(err,result){
        if(err){
            console.log(err);
            res.render('service',{title:'Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'db failed:select service_name from services_on_running failed'});
        }       
        else{
            var services_list=JSON.stringify(result);
            res.render('service',{title:'Service',Flag:'unset',Components:services_list,HostList:'',Unique_Flag:'',Config:'',err_info:''});
        }
    });
}


exports.get_info=function(req,res){
    var service=req.body.Service;
    var api_getserviceinfo_cmd="";
    var sql_cmd='';
    if(service == 'hdfs'){
	sql_cmd='select service_status,host from services_on_the_hosts_info where role_name="namenode"';
    }
    else if(service == 'mapreduce'){
	sql_cmd='select service_status,host from services_on_the_hosts_info where role_name="jobtracker"';
    }
    conn.query(sql_cmd,function(err,result){
	if(err){
		console.log(err);
	}
	else{
		if(result[0].service_status == 'dead'){
			res.send(200,{error:'service is dead,can not get the service info'});
		}
		else{
		    conn.query('select host_info.key_file_path,services_on_the_hosts_info.host from host_info,services_on_the_hosts_info where host_info.host=services_on_the_hosts_info.host and services_on_the_hosts_info.role_name="namenode"',function(err,result){
			    api_getserviceinfo_cmd='sh /usr/local/NArk/sbin/hadoop/get_hadoop_info.sh -h '+result[0].host+' -k '+result[0].key_file_path;
			    exec(api_getserviceinfo_cmd,function(err,stdout,stderr){
				if(err){
				    console.log(err); 
				    res.send(200,{error:'get service info failed'});
				}         
				else{
				    req.session.Service=service;
				    res.send(200,{result:stdout}); 
				}
				    
			    }); 


		    });
		}
	}
    });
}
exports.get_config=function(req,res){
    var service=req.body.Service;
    conn.query('select current_config from services_on_running where service_name=?',[service],function(err,res1){
        if(err){
            console.log(err); 
            res.send(200,{error:'get data from db failed'});
        }         
        else{
	    req.session.Service=service;
            res.send(200,{result:res1[0].current_config});
        }
            
    });
}
exports.get_action=function(req,res){
    var service=req.body.Service;
	console.log(service);
    conn.query('select * from services_on_the_hosts_info where service_name=?',[service],function(err,res1){
	console.log(res1);
        if(err){
            console.log(err); 
            res.send(200,{error:'get data from db failed'});
        }         
        else{
            req.session.service=service;
            res.send(200,{result:res1});  
        }
            
    });
}
exports.add_new_node=function(req,res){
    var service=req.body.Service;
    conn.query('select role_name from role_unique where service_name=? and unique_flag != 1',[service],function(err,res1){
        if(err){
            console.log(err); 
            res.send(200,{error:'get data from db failed'});
        }         
        else{
            console.log(res1);
            req.session.service=service;
            res.send(200,{result:res1});  
        }
            
    });

}
exports.select_new_node=function(req,res){
    var role_list=req.body.RoleList;
	console.log(role_list);
    var host_list_for_role={};
    var count=0;
    var service=req.session.service;
    for(var i=0;i<role_list.length;i++){
        conn.query('select host from host_info where host not in (select host from services_on_the_hosts_info where services_on_the_hosts_info.role_name = ?)',[role_list[i]],function(role){
            return function(err,res1){
                if(err){
                    console.log(err);
                    res.send(200,{error:'get data from db failed'});
                }
                else{
                    host_list_for_role[role]=res1;
                    console.log(res1);
                    console.log(host_list_for_role);
                    count++;
                    if(count == role_list.length){
                        req.session.service=service;
                        res.send(200,{result:host_list_for_role}); }  
                }
            };

        }(role_list[i]));        
    }   
}
exports.install_for_newnodes=function(req,res){
	var role_host=req.body.NodesSelected;
	var service=req.session.service;
	console.log(role_host[0]);
	console.log(typeof role_host);
	if(typeof role_host == 'string'){
        console.log("one host");
		console.log(role_host);
		var api_installrole_cmd='';
		var api_checkinstall_cmd='';	
		var api_configrole_cmd='';
		var api_checkconfig_cmd='';
        var host=role_host.split(":")[1];
        var role=role_host.split(":")[0];
		api_installrole_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role+' install';
		api_checkinstall_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -p hadoop';
		api_checkconfig_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -p hadoop -c initial';
		exec(api_installrole_cmd,function(role_var,host_var,api_checkinstall,api_config,api_checkconfig){
			return function(err,stdout,stderr){
				console.log(api_installrole_cmd);
				setTimeout(function(){
					exec(api_checkinstall,function(err,stdout,stderr){
						console.log(api_checkinstall);
						if(err){
							console.log(err);
							console.log(stdout);
						}
						else{
                            conn.query('select role_name,host from services_on_the_hosts_info where service_name=?',[service],function(err,result){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    var host_role_name_result=result;
                                    console.log(host_role_name_result);
                                    var add_node_host=host;
                                    var add_node_role_name=role;
                                    conn.query('select current_config from services_on_running where service_name=?',[service],function(err1,result1){
                                        var config=result1[0]['current_config']; 
                                        console.log(config);
                                        var makeConfigFileCmd='sh /usr/local/NArk/sbin/hadoop/generate.sh ';
                                        makeConfigFileCmd+=service+' ';
                                        if(service == 'hdfs'){
                                            for(var i=0;i<host_role_name_result.length;i++){
                                                if(host_role_name_result[i].role_name == 'namenode'){
                                                    makeConfigFileCmd+=host_role_name_result[i].host+' ';  
                                                    break;
                                                }
                                            }
                                            for(var i=0;i<host_role_name_result.length;i++){
                                                if(host_role_name_result[i].role_name == 'secondarynamenode'){
                                                    makeConfigFileCmd+=host_role_name_result[i].host+' '; 
                                                    break;
                                                } 
                                            }
                                            var datanode_list='';
                                            for(var i=0;i<host_role_name_result.length;i++){
                                                if(host_role_name_result[i].role_name == 'datanode'){
                                                    datanode_list+=host_role_name_result[i].host+":"; 
                                                }
                                            }
                    //                        datanode_list=datanode_list.substring(0,datanode_list.length-1);
                                            makeConfigFileCmd+=datanode_list+add_node_host+' ';
                                            //get nn_dir
                                            var nn_dir_start=config.indexOf("namenode-directories");
                                            nn_dir_start=config.indexOf("^",nn_dir_start);
                                            var nn_dir_end=config.indexOf(",",nn_dir_start);
                                            var nn_dir=config.substring(nn_dir_start+1,nn_dir_end);
                                            makeConfigFileCmd+=nn_dir+' ';
                                            //get snn_dir
                                            var snn_dir_start=config.indexOf("secondarynamenode-directories");
                                            snn_dir_start=config.indexOf("^",snn_dir_start);
                                            var snn_dir_end=config.indexOf(",",snn_dir_start);
                                            var snn_dir=config.substring(snn_dir_start+1,snn_dir_end);
                                            makeConfigFileCmd+=snn_dir+' ';
                                            //get dn_dir
                                            var dn_dir_start=config.indexOf("datanode-directories");
                                            dn_dir_start=config.indexOf("^",dn_dir_start);
                                            var dn_dir_end=config.indexOf(",",dn_dir_start);
                                            var dn_dir=config.substring(dn_dir_start+1,dn_dir_end);
                                            makeConfigFileCmd+=dn_dir;
                                            //not finished
                                        }
                                        else if(service == 'mapreduce'){
                                            for(var i=0;i<result1.length;i++){
                                                if(result1[i].role_name == 'jobtracker'){
                                                    makeConfigFileCmd+=result1[i].host; 
                                                    break;
                                                } 
                                            }
                                        }                   
                                        exec(makeConfigFileCmd,function(err,stdout,stderr){
                                            console.log(makeConfigFileCmd);
                                            if(err){
                                                console.log(err);
                                            }
                                            else{
                                                api_configrole_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+add_node_host+' hadoop '+add_node_role_name+' config';
                                                exec(api_configrole_cmd,function(err,stdout,stderr){
                                                    console.log(api_configrole_cmd);
                                                    setTimeout(function(){
                                                        exec(api_checkconfig,function(err,stdout,stderr){
    
                                                            console.log(api_checkconfig);
                                                            if(err){
                                                                console.log(err);
                                                                console.log(stdout);		
                                                                failed_host+=host+",";
                                                            }
                                                            else{
                                                                conn.query('insert into services_on_the_hosts_info set host=?,role_name=?,service_status=?,service_name=?',[add_node_host,add_node_role_name,'dead',service],function(err,result2){
                                                                    if(err){
                                                                        console.log(err);
                                                                    }
                                                                    else{
                                                                        res.redirect('/service');
                                                                    }

                                                                }); 
                                                            }
                                                        });

                                                    },20000); 

                                                });    
                                            }

                                        });    
                                    });
                                }

                            });
						}

					});

				},20000);

			};
		}(role,host,api_checkinstall_cmd,api_configrole_cmd,api_checkconfig_cmd));
	}
	else{
		var count=0;
		var count_total=0;
		for(var temp_var in role_host){
	//		console.log(role_host[i]);
			console.log(role_host[temp_var]);
			var arr_var=role_host[temp_var].split(":");
			var role=arr_var[0];
			var host=arr_var[1];
			var api_installrole_cmd='';
			var api_checkinstall_cmd='';	
			var api_configrole_cmd='';
			var api_checkconfig_cmd='';
			api_installrole_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role+' install';
			api_configrole_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role+' config';
			api_checkinstall_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -p hadoop';
			api_checkconfig_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -p hadoop -c initial';
			count_total++;
			var failed_host='';
			exec(api_installrole_cmd,function(role_var,host_var,api_checkinstall,api_config,api_checkconfig){
				return function(err,stdout,stderr){
					console.log(api_installrole_cmd);
					setTimeout(function(){
						count++;
						exec(api_checkinstall,function(err,stdout,stderr){
							console.log(api_checkinstall);
							count++;
							if(err){
								console.log(err);
								console.log(stdout);
								failed_host+=host+",";
							}
							else{
								exec(api_config,function(err,stdout,stderr){
									console.log(api_config);
									setTimeout(function(){
										exec(api_checkconfig,function(err,stdout,stderr){
											console.log(api_checkconfig);
											if(err){
												console.log(err);
												console.log(stdout);		
												failed_host+=host+",";
											}
											else{
												if(count==count_total){
													res.redirect('/service');
												}	
											}
										});

									},20000);
								});
							}

						});

					},20000);

				};


			}(role,host,api_checkinstall_cmd,api_configrole_cmd,api_checkconfig_cmd));

		}
	}

}
exports.start_all_nodes=function(req,res){
    var service=req.body.Service;
    conn.query('select host,role_name from services_on_the_hosts_info where service_name = ? and service_status = ?',[service,'dead'],function(err,res1){
        if(err){
            console.log(err);
            res.send(200,{error_info:'get data from db failed'});
        }         
        else{
            var temp_result=res1;
            if(temp_result.length == 0)
                res.send(200,{error_info:'all role has been started'});
            else{
                var count_total=0;
                var count_success=0;
                for(var i=0;i<temp_result.length;i++){
                    var api_startnodeservice_cmd='';
                    var api_checkonenodeservice_start_cmd='';
                    if(service == 'hdfs' || service == 'mapreduce'){
                        api_startnodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+temp_result[i].host+' hadoop '+temp_result[i].role_name+' start'; 
                        api_checkonenodeservice_start_cmd='sh /usr/local/NArk/bin/CHECK -h '+temp_result[i].host+' -s hadoop-'+ temp_result[i].role_name;
                    }
                    else{
                        api_startnodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+temp_result[i].host+' '+service+' '+temp_result[i].role_name+' start'; 
                        api_checkonenodeservice_start_cmd='sh /usr/local/NArk/bin/CHECK -h '+temp_result[i].host+' -s '+service+'-'+ temp_result[i].role_name;
                    }
                    exec(api_startnodeservice_cmd,function(host,role,api_checkonenodeservice_start_cmd1){
                        console.log(api_startnodeservice_cmd);
                        return function(err,stdout,stderr){
                            setTimeout(function(){
                                exec(api_checkonenodeservice_start_cmd1,function(err,stdout,stderr){
                                    console.log(api_checkonenodeservice_start_cmd1);
                                    if(err){
                                        console.log(err); 
                                        count_total++;
                                        if(count_total==temp_result.length){
                                            if(count_success==temp_result.length){
                                                res.send(200,{result:'success'});
                                            }
                                            else{
                                                res.send(200,{error_info:'some_failed'});
                                            }

                                        }
                                    }           
                                    else{
                                        conn.query('update services_on_the_hosts_info set service_status=? where host=? and role_name=?',['health',host,role],function(err,result){
                                        count_total++;
                                        if(err){
                                            console.log(err);
                                        }
                                        else{
                                            count_success++;
                                        }
                                        if(count_total==temp_result.length){
                                            if(count_success==temp_result.length){
                                                res.send(200,{result:'success'});
                                            }
                                            else{
                                                res.send(200,{error_info:'some_failed'});
                                            }

                                        }
                                        });
                                    }

                                });
                            },20000);	
                        };
                    }(temp_result[i].host,temp_result[i].role_name,api_checkonenodeservice_start_cmd));
                }
            }
        }
            
    });
}

exports.stop_all_nodes=function(req,res){
    var service=req.body.Service;
    conn.query('select host,role_name from services_on_the_hosts_info where service_name = ? and service_status = ?',[service,'health'],function(err,res1){
        if(err){
            console.log(err);
            res.send(200,{error_info:'get data from db failed'});
        }           
        else{
            var temp_result=res1;
            var count_total=0;
            var count_success=0;
            for(var i=0;i<temp_result.length;i++){
                var api_stopnodeservice_cmd='';
                var api_checkonenodeservice_stop_cmd='';
                if(service == 'hdfs' || service == 'mapreduce'){
                    api_stopnodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+temp_result[i].host+' hadoop '+temp_result[i].role_name+' stop'; 
                    api_checkonenodeservice_stop_cmd='sh /usr/local/NArk/bin/CHECK -h '+temp_result[i].host+' -s hadoop-'+ temp_result[i].role_name;
                }
                else{
                    api_stopnodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+temp_result[i].host+' '+service+' '+temp_result[i].role_name+' stop'; 
                    api_checkonenodeservice_stop_cmd='sh /usr/local/NArk/bin/CHECK -h '+temp_result[i].host+' -s '+service+'-'+ temp_result[i].role_name;
                }
                exec(api_stopnodeservice_cmd,function(host,role,api_checkonenodeservice_stop_cmd1){
                    console.log(api_stopnodeservice_cmd);
                    return function(err,stdout,stderr){
                        setTimeout(function(){
                            exec(api_checkonenodeservice_stop_cmd1,function(err,stdout,stderr){
                                console.log(api_checkonenodeservice_stop_cmd1);
                                if(err){
                                    conn.query('update services_on_the_hosts_info set service_status=? where host=? and role_name=?',['dead',host,role],function(err,result){
                                    count_total++;
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        count_success++;
                                    }
                                    if(count_total==temp_result.length){
                                        if(count_success==temp_result.length){
                                            res.send(200,{result:'success'});
                                        }
                                        else{
                                            res.send(200,{error_info:'some_failed'});
                                        }

                                    }
                                    });
                                }           
                                else{
                                    count_total++;
                                }

                            });
                        },20000);	
                    };
                }(temp_result[i].host,temp_result[i].role_name,api_checkonenodeservice_stop_cmd));
            }
        }
            
    });
}
exports.start_node=function(req,res){
    var host=req.body.Host;
    var role=req.body.Role;
    var service=req.session.service;
    var api_startonenodeservice_cmd='';
    var api_checkonenodeservice_cmd='';
    if(service == 'hdfs' || service == 'mapreduce'){
        api_startonenodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role+' start'; 
        api_checkonenodeservice_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -s hadoop-'+ role;
    }
    else{
        api_startonenodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' '+service+' '+role+' start'; 
    } 
    var api_checkonenodeservice_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -s hadoop-'+ role;
    exec(api_startonenodeservice_cmd,function(err,stdout,stderr){
        console.log(api_checkonenodeservice_cmd);
        setTimeout(function(){
            exec(api_checkonenodeservice_cmd,function(err,stdout,stderr){
                if(err){
                    console.log(err); 
                    res.send(200,{error:'exec start operation failed'});
                }           
                else{
                    conn.query('update services_on_the_hosts_info set service_status=? where host=? and role_name=?',['health',host,role],function(err,result){
                        if(err){
                            console.log(err);
                        }
                        else{
                            res.send(200,{result:'success'}); 
                        }

                    });
                }

            });
        },20000);
    });

}
exports.stop_node=function(req,res){
    var host=req.body.Host;
    var role=req.body.Role;
    var service=req.session.service;
    var api_stoponenodeservice_cmd='';
    var api_checkonenodeservice_cmd1='';
    if(service == 'hdfs' || service == 'mapreduce'){
        api_stoponenodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role+' stop'; 
        api_checkonenodeservice_cmd1='sh /usr/local/NArk/bin/CHECK -h '+host+' -s hadoop-'+ role;
    }
    else{
        api_startonenodeservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' '+service+' '+role+' stop'; 
    } 
    exec(api_stoponenodeservice_cmd,function(err,stdout,stderr){
	console.log(api_checkonenodeservice_cmd1);
	setTimeout(function(){
		// api check service stop the return value is 1 when the service is stopped.
		exec(api_checkonenodeservice_cmd1,function(err,stdout,stderr){
			if(err){
			    console.log(err);
			    conn.query('update services_on_the_hosts_info set service_status=? where host=? and role_name=?',['dead',host,role],function(err,result){
				if(err){
					console.log(err);
				}
				else{
				    res.send(200,{result:'success'}); 
				}

			    });
	
			}           
			else{
			    res.send(200,{error:'exec start operation failed'});
			}
		});
	},20000);
            
    });
}

/*
here is the add service functions,such as select service,select hosts for service,modify config for service and so on

*/
exports.select_service=function(req,res){
    console.log('the serviceChoice radio is '+req.body.serviceChoice);
    var serviceChoice=req.body.serviceChoice;
    var user=req.session.username;
    console.log('the user is ' + user);
    conn.query('select * from services_on_running where service_name=?',[serviceChoice],function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(result.length != 0){
                res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'the service has been installed'});
            }
            else{
                conn.query('select role_name from services_can_be_installed where service_name=?',[serviceChoice],function(err,result){
                    var flag='true';
                    if(err){
                        console.log(err); 
                        flag='false';
                    }
                    else{
                        var role_name=result[0]['role_name'];
                        req.session.Service=serviceChoice; conn.query('select host from host_info',function(err,result){
                            if(err){
                                console.log(err); 
                                res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'select host failed'});//should be modified
                            }      
                            else{
                                var str_host_list=JSON.stringify(result);
                                console.log(result);
                                console.log(str_host_list);
                                  
                                conn.query('select role_name,unique_flag from role_unique where service_name='+'"'+serviceChoice+'"',function(err,result){
                                    if(err){
                                        console.log(err); 
                                    }
                                    else{
                                        var str_res=JSON.stringify(result); 
                                        req.session.username=user;
                                        console.log(req.session.username);
                                        res.render('service',{title:'Service:Select Service',Flag:'true',Components:role_name,HostList:str_host_list,Unique_Flag:str_res,Config:'',err_info:''});
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
exports.select_hosts_for_service=function(req,res){ 
    var service=req.session.Service;
    var count=0;
    var count_flag=0;
    console.log(req.body);
    console.log(JSON.stringify(req.body)); 
    conn.query('select role_name from services_can_be_installed where service_name=?',[service],function(err,result){
            if(err){
                console.log(err); 
            }
            else{

                var role_name_arr=(result[0]['role_name']).split(",");
                for(var j=0;j<role_name_arr.length;j++){
		    exec('',function(role_name){
			console.log(role_name);
			return function(err,stdout,stderr){
			    var temp=req.body['hostslist_'+role_name]; 
			    if(typeof temp == 'string'){
				count_flag++;
				console.log(temp);
				var arr_host=temp.split(',');
				var api_installservice_cmd='';
				var api_checkservice_cmd='';
				if(service == 'hdfs' || service == 'mapreduce'){
				    api_installservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+arr_host[1]+' hadoop '+arr_host[0]+' install'; 
				    api_checkservice_cmd='sh /usr/local/NArk/bin/CHECK -h '+arr_host[1]+' -p hadoop';
				}
				else{
				    api_installservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+arr_host[1]+' '+service+' '+arr_host[0]+' install';                        
				    api_checkservice_cmd='sh /usr/local/NArk/bin/CHECK -h '+arr_host[1]+' -p '+service; 
				}    

				exec(api_installservice_cmd,function(err,stdout,stderr){
//				    sleep.sleep(20);
				    setTimeout(function(api_checkservice_cmd_tmp){
				    exec(api_checkservice_cmd_tmp,function(err,stderr,stdout){
					if(err){
					    console.log(api_checkservice_cmd_tmp);
					    console.log(stdout);
					    console.log(err);
					}
					else{
						conn.query('delete from services_on_the_hosts_info_temp where host=? and role_name=?',[arr_host[1],arr_host[0]],function(err,result){
							conn.query('insert into services_on_the_hosts_info_temp set host=?,role_name=?,service_name=?',[arr_host[1],arr_host[0],service],function(err,result){
							    if(err){
								console.log(err);
								res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'insert into services_on_the_hosts_info_temp error'});
							    } 
							    else{
								count++;
								if(count==count_flag){
								    //return the config page to modify the service's config
								    conn.query('select service_name,role_name,default_config from services_can_be_installed where service_name=?',[service],function(err,result){
									if(err){
									    console.log(err); 
									    res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'get default_config failed'});
									}
									else{
									    var str_config=JSON.stringify(result);
									    res.render('service',{title:'Service:Select Service',Flag:'true',Components:'',HostList:'',Unique_Flag:'',Config:str_config,err_info:''});
									}
								    });
								}
							    }
							});  
						});
 
					}

				    });	
				    }(api_checkservice_cmd),20000);
				});
			    }
			    else{
				for(var host_role in temp){
				    count_flag++;
				    var arr_host=new Array();
				    arr_host=(temp[host_role]).split(',');
				    var api_installservice_cmd='';
				    var api_checkservice_cmd='';
				    if(service == 'hdfs' || service == 'mapreduce'){
					api_installservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+arr_host[1]+' hadoop '+arr_host[0]+' install'; 
					api_checkservice_cmd='sh /usr/local/NArk/bin/CHECK -h '+arr_host[1]+' -p hadoop';
				    }
				    else{
					api_installservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+arr_host[1]+' '+service+' '+arr_host[0]+' install';                        
					api_checkservice_cmd='sh /usr/local/NArk/bin/CHECK -h '+arr_host[1]+' -p '+service;
				    }    
				    exec(api_installservice_cmd,function(host,role_name,api_checkservice_cmd1){
					return function(err,stdout,stderr){
						//sleep.sleep(20);
						setTimeout(function(api_checkservice_cmd_tmp1){
						exec(api_checkservice_cmd_tmp1,function(err,stdout,stderr){
							if(err){
							        console.log(api_checkservice_cmd_tmp1);
						                console.log(stdout);
						        	console.log(err);
							}
							else{

								conn.query('delete from services_on_the_hosts_info_temp where host=? and role_name=?',[host,role_name],function(err,result){
								    conn.query('insert into services_on_the_hosts_info_temp set host=?,role_name=?,service_name=?',[host,role_name,service],function(err,result){
									if(err){
									    console.log(err);
									    res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'insert into services_on_the_hosts_info_temp error'});
									} 
									else{
									    count++;
									    if(count==count_flag){
										//return the config page to modify the service's config
										conn.query('select service_name,role_name,default_config from services_can_be_installed where service_name=?',[service],function(err,result){
										    if(err){
											console.log(err); 
											res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'get default_config failed'});
										    }
										    else{
											var str_config=JSON.stringify(result);
											res.render('service',{title:'Service:Select Service',Flag:'true',Components:'',HostList:'',Unique_Flag:'',Config:str_config,err_info:''});
										    }
										});
									    }
									}
								    }); 		
								});

							}
						});

						}(api_checkservice_cmd),20000);
					};
				    }(arr_host[1],arr_host[0]),api_checkservice_cmd);
				}                   
			    }
			};
		    }(role_name_arr[j]));
                }
            } 
    });
    
}
exports.modify_config=function(req,res){
    console.log(req.body);
    var service=req.session.Service;
    //var service='hdfs';
    console.log(service);
    conn.query('select default_config from services_can_be_installed where service_name=?',[service],function(err,result){
        if(err){
            console.log(err); 
            res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
        }
        else{
            var makeConfigFileCmd='sh /usr/local/NArk/sbin/hadoop/generate.sh ';
            //need config set api
            var update_config='';
            var config=result[0]['default_config']; 
	    conn.query('select host,role_name from services_on_the_hosts_info_temp where service_name=?',[service],function(err,result1){
                if(err){
                    console.log(err); 
                    res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
                }
                else{
                    makeConfigFileCmd+=service+' ';
                    if(service == 'hdfs'){
                        for(var i=0;i<result1.length;i++){
                            if(result1[i].role_name == 'namenode'){
                                makeConfigFileCmd+=result1[i].host+' ';  
                                break;
                            }
                        }
                        for(var i=0;i<result1.length;i++){
                            if(result1[i].role_name == 'secondarynamenode'){
                                makeConfigFileCmd+=result1[i].host+' '; 
                                break;
                            } 
                        }
                        var datanode_list='';
                        for(var i=0;i<result1.length;i++){
                            if(result1[i].role_name == 'datanode'){
                                datanode_list+=result1[i].host+":"; 
                            }
                        }
                        datanode_list=datanode_list.substring(0,datanode_list.length-1);
                        makeConfigFileCmd+=datanode_list+' ';
                        //get nn_dir
                        var nn_dir_start=config.indexOf("namenode-directories");
                        nn_dir_start=config.indexOf("^",nn_dir_start);
                        var nn_dir_end=config.indexOf(",",nn_dir_start);
                        var nn_dir=config.substring(nn_dir_start+1,nn_dir_end);
						nn_dir=req.body["namenode-directories"];
                        makeConfigFileCmd+=nn_dir+' ';
                        //get snn_dir
                        var snn_dir_start=config.indexOf("secondarynamenode-directories");
                        snn_dir_start=config.indexOf("^",snn_dir_start);
                        var snn_dir_end=config.indexOf(",",snn_dir_start);
                        var snn_dir=config.substring(snn_dir_start+1,snn_dir_end);
						var snn_dir=req.body["secondarynamenode-directories"];
                        makeConfigFileCmd+=snn_dir+' ';
                        //get dn_dir
                        var dn_dir_start=config.indexOf("datanode-directories");
                        dn_dir_start=config.indexOf("^",dn_dir_start);
                        var dn_dir_end=config.indexOf(",",dn_dir_start);
                        var dn_dir=config.substring(dn_dir_start+1,dn_dir_end);
						dn_dir=req.body["datanode-directories"];
                        makeConfigFileCmd+=dn_dir;
                        //not finished
                    }
                    else if(service == 'mapreduce'){
                        for(var i=0;i<result1.length;i++){
                            if(result1[i].role_name == 'jobtracker'){
                                makeConfigFileCmd+=result1[i].host; 
                                break;
                            } 
                        }
                    }
			console.log(makeConfigFileCmd);
                    exec(makeConfigFileCmd,function(err,stdout,stderr){
                        if(err){
                            console.log(err); 
                            res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
                        }
                        else{
			    var count=0;
			    for(var i=0;i<result1.length;i++){
					var api_configservice_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+result1[i].host+' hadoop '+result1[i].role_name+' config';
					exec(api_configservice_cmd,function(role_name,host){
						return function(err,stdout,stderr){
							var api_checkservice_config_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -p hadoop -c initial';
							setTimeout(function(api_checkservice_config_cmd_tmp){
								exec(api_checkservice_config_cmd_tmp,function(err,stdout,stderr){
									console.log(api_checkservice_config_cmd_tmp);
									if(err){
										console.log(err);
										console.log(api_checkservice_config_cmd_tmp+":"+stdout);
									}
									else{
										conn.query("select * from services_on_the_hosts_info where host=? and role_name=?",[host,role_name],function(err,result_check){
											if(err){
												console.log(err);

											}
											else{
												var sql_cmd="";
												if(result_check.length == 0){
													sql_cmd="insert into services_on_the_hosts_info set service_name=?,service_status=?,host=?,role_name=?";										
												}	
												else{
													sql_cmd="update services_on_the_hosts_info set service_name=?,service_status=? where host=? and role_name=?";
												}
												conn.query(sql_cmd,[service,'dead',host,role_name],function(err,result2){
													if(err){
														console.log(err);
													}
													count++;
													if(count == result1.length){
														var role_config_arr=config.split(";");
														var role_name_list='';
														for(var i=0;i<role_config_arr.length;i++){
															if(role_config_arr[i].length == 0)
																continue;
															var role_config=(role_config_arr[i]).split(":")[1];
															var role_name=(role_config_arr[i]).split(":")[0];
															update_config+=role_name+":";
															role_name_list+=role_name+',';
															var specific_config_arr=role_config.split(",");
															for(var j=0;j<specific_config_arr.length;j++){
																if(specific_config_arr[j].length == 0)
																	continue;
																var specific_config_name=(specific_config_arr[j]).split("^")[0];
																var specific_config_value=req.body[specific_config_name];
																update_config+=specific_config_name+'^'+specific_config_value+',';
															}
															update_config+=";";
														}
														role_name_list=role_name_list.substring(0,role_name_list.length-1);
														console.log(update_config);
														conn.query('select * from services_on_running where service_name=?',[service],function(err,result_test){
															if(err){
																console.log(err);		
															}
															else{
																if(result_test.length == 0){
																	conn.query('insert into services_on_running set current_config=?,service_name=?,role_name=?',[update_config,service,role_name_list],function(err,result){
																		if(err){
																			console.log(err);
																			res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
																		}         
																		else{
																			console.log('success insert');
																			//res.render('service',{title:'Service:Select Service',Flag:'unset',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:''});
																			res.redirect('/service');
																		}
																	}); 	
																}	
																else{
																	conn.query('update services_on_running set current_config=?,role_name=? where service_name=?',[update_config,role_name_list,service],function(err,result){
																		if(err){
																			console.log(err);
																			res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
																		}         
																		else{
																			console.log('success update');
																			//res.render('service',{title:'Service:Select Service',Flag:'unset',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:''});
																			res.redirect('/service');
																		}
																	}); 
																}
															}
														});
													}
												});
											}

										});
									
										conn.query("insert into services_on_the_hosts_info set host=?,service_name=?,role_name=?,service_status=?",[host,service,role_name,'dead'],function(err,result2){
											if(err){
												console.log(err);
											}
											count++;
											if(count == result1.length){
												var role_config_arr=config.split(";");
												var role_name_list='';
												for(var i=0;i<role_config_arr.length;i++){
													if(role_config_arr[i].length == 0)
														continue;
													var role_config=(role_config_arr[i]).split(":")[1];
													var role_name=(role_config_arr[i]).split(":")[0];
													update_config+=role_name+":";
													role_name_list+=role_name+',';
													var specific_config_arr=role_config.split(",");
													for(var j=0;j<specific_config_arr.length;j++){
														if(specific_config_arr[j].length == 0)
															continue;
														var specific_config_name=(specific_config_arr[j]).split("^")[0];
														var specific_config_value=req.body[specific_config_name];
														update_config+=specific_config_name+'^'+specific_config_value+',';
													}
													update_config+=";";
												}
												role_name_list=role_name_list.substring(0,role_name_list.length-1);
												console.log(update_config);
												conn.query('select * from services_on_running where service_name=?',[service],function(err,result_test){
													if(err){
														console.log(err);		
													}
													else{
														if(result_test.length == 0){
															conn.query('insert into services_on_running set current_config=?,service_name=?,role_name=?',[update_config,service,role_name_list],function(err,result){
																if(err){
																	console.log(err);
																	res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
																}         
																else{
																	console.log('success insert');
																	//res.render('service',{title:'Service:Select Service',Flag:'unset',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:''});
																	res.redirect('/service');
																}
															}); 	
														}	
														else{
															conn.query('update services_on_running set current_config=?,role_name=? where service_name=?',[update_config,role_name_list,service],function(err,result){
																if(err){
																	console.log(err);
																	res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
																}         
																else{
																	console.log('success update');
																	//res.render('service',{title:'Service:Select Service',Flag:'unset',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:''});
																	res.redirect('/service');
																}
															}); 
														}
													}
												});
											}
										});

									}
								});
							}(api_checkservice_config_cmd),30000);
						};

					}(result1[i].role_name,result1[i].host));
			    }
                        }
                            
                    });
 
                }
                
            });
        }
            
    }); 
}
exports.remove_service=function(req,res){
    console.log('the serviceChoice radio is '+req.body.serviceChoice);
    var serviceChoice=req.body.serviceChoice;
    conn.query('select * from services_on_running where service_name=?',[serviceChoice],function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(result.length == 0){
                res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'the service is not running'});
            }
            else{
                conn.query('select * from services_on_the_hosts_info where service_name=? and service_status=?',[serviceChoice,'health'],function(err,result){
                    var flag='true';
					if(err){
						console.log(err);
					}
					else{
						if(result.length == 0){
							uninstall_service(serviceChoice);
						}
						else{
							res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'please stop the service firstly'});
						}
					}
                });
            }
        }
    });
} 

var uninstall_service_total_role_node=0;
var uninstall_service_success_count_role_node=0;
var uninstall_service_count_role_node=0;
function uninstall_service(service){
	conn.query('select host,role_name from services_on_the_hosts_info where service_name=?',[service_name],function(err,result){
		if(err){
			console.log(err);
		}
		else{
			uninstall_service_total_role_node=result.length;
			for(var i=0;i<result.length;i++){
				uninstall_one_role_node(result[i].host,result[i].role_name);
			}
		}
	});
}
function uninstall_one_role_node(host,role_name){
	var uninstall_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role_name+' uninstall';
	var uninstall_check_cmd='sh /usr/local/NArk/bin/CHECK -h '+host+' -p hadoop';
	exec(uninstall_cmd,function(err,stdout,stderr){
		setTimeout(function(){
			exec(uninstall_check_cmd,function(err,stdout,stderr){
				uninstall_service_count_role_node++;
				if(err){
					conn.query('delect from services_on_the_hosts_info where host=?,role_name=?',[host,role_name],function(err,result){
						if(err){
							console.log(err);
						}
						else{
							uninstall_service_sucess_count_role_node++;	
						}
					});
				}
				if(uninstall_service_total_role_node == uninstall_service_count_role_node){
					if(uninstall_service_success_count_role_node == uninstall_service_total_role_node){
						res.render('service',{title:'Service:Select Service',Flag:'true',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'please stop the service firstly'});
					}
				}
			});
		},20*1000);
	});
}

/*
function service_operation(host,role_name,operation){
	var api_cmd='sh /usr/local/NArk/uppershell/bin/DPOP '+host+' hadoop '+role+' '+operation;
	exec(api_cmd,function(err,stdout,stderr){
					
	});
}
function service_check(host,role_name,operation){
	var api_check_cmd='sh
}
*/
