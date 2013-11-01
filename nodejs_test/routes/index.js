
/*
 * GET home page.
 */
var mysql=require('mysql');
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
            res.render('server',{title:'Server:Add New Server',flag:'false',CheckRes:'database option failed',DataBase_Res:''});
        }
        else{
            console.log(typeof result);
            var str_result=JSON.stringify(result);
            console.log(str_result);
/*                for(var i=0;i<result.length();i++){
                console.log('\n');
                console.log(result[i]);
            }
*/
            var str_result1=str_result.replace(/"/g,'\"');
            res.render('server',{title:'Server',flag:'false',CheckRes:'',DataBase_Res:str_result1});
        }
    });
}
exports.service=function(req,res){
    res.render('service',{title:'Service'});
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
        var illegal_flag=1;
       if(illegal_flag){
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
        else{
            res.render('server',{title:"Server:Add New Server",CheckRes:'the input info is illegal',DataBase_Res:''});
        }
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
        conn.query("select * from host_info",function(err,result){
            if(err){
                console.log(err);
                res.render('server',{title:'Server:Add New Server',flag:'true',CheckRes:'database option failed',DataBase_Res:''});
            }
            else{
                console.log(typeof result);
                var str_result=JSON.stringify(result);
                console.log(str_result);
/*                for(var i=0;i<result.length();i++){
                    console.log('\n');
                    console.log(result[i]);
                }
*/
                var str_result1=str_result.replace(/"/g,'\"');
                res.render('server',{title:'Server',flag:'false',CheckRes:'',DataBase_Res:str_result1});
            }
        });
    }
}
exports.show_server_list=function(req,res){

}
