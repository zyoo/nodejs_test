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
    res.render('service',{title:'Service',Flag:'unset',Components:'',HostList:'',Unique_Flag:'',Config:'',err_info:''});
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

                    else{
                        for(var host_role in temp){
                            count_flag++;
                            var arr_host=new Array();
                            arr_host=(temp[host_role]).split(',');
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
