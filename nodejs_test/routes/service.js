var mysql=require('mysql');
var exec=require('child_process').exec;
var conn=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager',
    port:3306
});
exports.show_service=function(req,res){
    console.log('the request is '+req.body);
    conn.query('select service_name from services_on_running',function(err,result){
        if(err){
            console.log(err);
            res.render('service',{title:'Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'select service_name from services_on_running failed'});
        }       
        else{
            var services_list=JSON.stringify(result);
            console.log(services_list);
            res.render('service',{title:'Service',Flag:'unset',Components:services_list,HostList:'',Unique_Flag:'',Config:'',err_info:''});
        }
    });
}


exports.get_info=function(req,res){
    var service=req.body.Service;
    var api_getserviceinfo_cmd="ls";
    exec(api_getserviceinfo_cmd,function(err,stdout,stderr){
        if(err){
            console.log(err); 
            res.send(500,{error:'get service info failed'});
        }         
        else{
            res.send(200,{result:stdout}); 
        }
            
    }); 

}
exports.get_config=function(req,res){
    var service=req.body.Service;
    conn.query('select current_config from services_on_running where service_name=?',[service],function(err,res1){
        if(err){
            console.log(err); 
            res.send(500,{error:'get data from db failed'});
        }         
        else{
            res.send(200,{result:res1[0].current_config});
        }
            
    });
}
exports.get_action=function(req,res){
    var service=req.body.Service;
    conn.query('select * from services_on_the_hosts_info',function(err,res1){
        if(err){
            console.log(err); 
            res.send(500,{error:'get data from db failed'});
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
            res.send(500,{error:'get data from db failed'});
        }         
        else{
            console.log(res1);
            res.send(200,{result:res1});  
        }
            
    });

}
exports.select_new_node=function(req,res){
    var role_list=req.body.RoleList;
    for(var i=0;i<role_list.length;i++){
        conn.query('select host from services_on_the_hosts_info where role_name != ?',[role_list[i]],function(err,res1){
            if(err){
                console.log(err);
                res.send(500,{error:'get data from db failed'});
            }
            else{
                
            }
        });
    }
    
}


exports.start_all_nodes=function(req,res){
    var service=req.body.Service;
    conn.query('select host,role_name from services_on_the_hosts_info where service_name = ? and service_status = ?',[service,'dead'],function(err,res1){
        if(err){
            console.log(err);
            res.send(500,{error:'get data from db failed'});
        }         
        else{
            var temp_result=res1;
            var count=0;
            for(var i=0;i<temp_result.length;i++){
                var api_startnodeservice_cmd='';
                if(service == 'hdfs' || service == 'mapreduce')
                    api_startnodeservice_cmd='sh DPOP '+temp_result[i].host+' hadoop '+temp_result[i].role_name+' start'; 
                else
                    api_startnodeservice_cmd='sh DPOP '+temp_result[i].host+' '+service+' '+temp_result[i].role_name+' start'; 
                exec(api_startnodeservice_cmd,function(err,stdout,stderr){
                    if(err){
                        console.log(err); 
                    }     
                    else{
                        count++; 
                        if(count == temp_result.length){
                            res.send(200,{result:'start suceess'}); 
                        }
                    
                    }
                    
                });
            }
        }
            
    });
}

exports.stop_all_nodes=function(req,res){
    var service=req.body.Service;
    conn.query('select host,role_name from services_on_the_hosts_info where service_name = ? and service_status = ?',[service,'health'],function(err,res1){
        if(err){
            console.log(err);
            res.send(500,{error:'get data from db failed'});
        }           
        else{
             var temp_result=res1;
            var count=0;
            for(var i=0;i<temp_result.length;i++){
                var api_startnodeservice_cmd='';
                if(service == 'hdfs' || service == 'mapreduce')
                    api_startnodeservice_cmd='sh DPOP '+temp_result[i].host+' hadoop '+temp_result[i].role_name+' stop'; 
                else
                    api_startnodeservice_cmd='sh DPOP '+temp_result[i].host+' '+service+' '+temp_result[i].role_name+' stop'; 
                exec(api_startnodeservice_cmd,function(err,stdout,stderr){
                    if(err){
                        console.log(err); 
                    }     
                    else{
                        count++; 
                        if(count == temp_result.length){
                            res.send(200,{result:'stop suceess'}); 
                        }
                    
                    }
                    
                });
            }

        }
            
    });

}
exports.start_node=function(req,res){
    var host=req.body.Host;
    var role=req.body.Role;
    var service=req.session.service;
    var api_startonenodeservice_cmd='';
    if(service == 'hdfs' || service == 'mapreduce'){
        api_startonenodeservice_cmd='sh DPOP '+host+' hadoop '+role+' start'; 
    }
    else{
        api_startonenodeservice_cmd='sh DPOP '+host+' '+service+' '+role+' start'; 
    } 
    exec(api_startonenodeservice_cmd,function(err,stdout,stderr){
        if(err){
            console.log(err); 
            res.send(500,{error:'exec start operation failed'});
        }           
        else{
            res.send(200,{result:'suceesee'}); 
        }
            
    });

}
exports.stop_node=function(req,res){
    var host=req.body.Host;
    var role=req.body.Role;
    var service=req.session.service;
    var api_startonenodeservice_cmd='';
    if(service == 'hdfs' || service == 'mapreduce'){
        api_startonenodeservice_cmd='sh DPOP '+host+' hadoop '+role+' stop'; 
    }
    else{
        api_startonenodeservice_cmd='sh DPOP '+host+' '+service+' '+role+' stop'; 
    } 
    exec(api_startonenodeservice_cmd,function(err,stdout,stderr){
        if(err){
            console.log(err); 
            res.send(500,{error:'exec start operation failed'});
        }           
        else{
            res.send(200,{result:'suceesee'}); 
        }
            
    });

}

exports.select_service=function(req,res){
    console.log('the serviceChoice radio is '+req.body.serviceChoice);
    var serviceChoice=req.body.serviceChoice;
    conn.query('select role_name from services_can_be_installed where service_name=?',[serviceChoice],function(err,result){
        var flag='true';
        if(err){
            console.log(err); 
            flag='false';
        }
        else{
            var role_name=result[0]['role_name'];
            req.session.serviceChoice=serviceChoice;

             conn.query('select host from host_info',function(err,result){
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
                            res.render('service',{title:'Service:Select Service',Flag:'true',Components:role_name,HostList:str_host_list,Unique_Flag:str_res,Config:'',err_info:''});
                        }
                        
                    });
                } 
                
            });                   

        }
        
    });
}
exports.select_hosts_for_service=function(req,res){
    var service=req.session.serviceChoice;
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
                    var temp=req.body['hostslist_'+role_name_arr[j]]; 
                    if(typeof temp == 'string'){
                        count_flag++;
                        console.log(temp);
                        var api_installservice_cmd='';
                        if(service == 'hdfs' || service == 'mapreduce'){
                            api_installservice_cmd='sh DPOP '+arr_host[0]+' hadoop '+arr_host[1]+' install'; 
                        }
                        else{
                            api_installservice_cmd='sh DPOP '+arr_host[0]+' '+service+' '+arr_host[1]+' install';                        
                        }    

                        exec(api_installservice_cmd,function(err,stdout,stderr){
                            if(err){
                                console.log(err);
                                res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'the service install operation failed'});
                            } 
                            else{
                                conn.query('insert into services_on_the_hosts_info_temp set host=?,role_name=?',[arr_host[0],arr_host[1]],function(err,result){
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
                            
                            }
                            
                        });
                    }

                    else{
                        for(var host_role in temp){
                            count_flag++;
                            var arr_host=new Array();
                            arr_host=(temp[host_role]).split(',');
                            var api_installservice_cmd='';
                            if(service == 'hdfs' || service == 'mapreduce'){
                                api_installservice_cmd='sh DPOP '+arr_host[0]+' hadoop '+arr_host[1]+' install'; 
                            }
                            else{
                                api_installservice_cmd='sh DPOP '+arr_host[0]+' '+service+' '+arr_host[1]+' install';                        
                            }    

                            exec(api_installservice_cmd,function(err,stdout,stderr){
                                if(err){
                                    console.log(err);
                                    res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'the service install operation failed'});
                                } 
                                else{
                                    conn.query('insert into services_on_the_hosts_info_temp set host=?,role_name=?',[arr_host[0],arr_host[1]],function(err,result){
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
                                
                                }
                                
                            });

                        }                   
                    }
                }
            } 
            
    });
    
}
exports.modify_config=function(req,res){
    console.log(req.body);
    var service=req.session.serviceChoice;
    //var service='hdfs';
    console.log(service);
    conn.query('select current_config from services_on_running where service_name=?',[service],function(err,result){
        if(err){
            console.log(err); 
        }
        else{
        //need config set api
            var update_config='';
            var config=result[0]['current_config'];
            var role_config_arr=config.split(";");
            for(var i=0;i<role_config_arr.length;i++){
                if(role_config_arr[i].length == 0)
                    continue;
                var role_config=(role_config_arr[i]).split(":")[1];
                var role_name=(role_config_arr[i]).split(":")[0];
                update_config+=role_name+":";
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
            console.log(update_config);
            conn.query('update services_on_running set current_config=? where service_name=?',[update_config,service],function(err,result){
                if(err){
                    console.log(err);
                    res.render('service',{title:'Service:Select Service',Flag:'false',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:'modify config failed'});
                }         
                else{
                    res.render('service',{title:'Service:Select Service',Flag:'true',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:''});
                }
            });
        }
            
    }); 

}
