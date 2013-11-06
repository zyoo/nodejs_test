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
    res.render('service',{title:'Service',Flag:'unset',Components:'',HostList:''});
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
            conn.query('select host from host_info',function(err,result){
                if(err){
                    console.log(err); 
                }      
                else{
                    var str_host_list=JSON.stringify(result);
                    console.log(result);
                    console.log(str_host_list);
                      
                    res.render('service',{title:'Service:Select Service',Flag:'true',Components:role_name,HostList:str_host_list});
                } 
                
            });
        }
        
    });
}
exports.select_hosts_for_service=function(req,res){
    console.log(req.body);
    console.log(req.body.hostslist);
    res.render('service',{title:'Service:Select Service',Flag:'unset',Components:'',HostList:''});
}
