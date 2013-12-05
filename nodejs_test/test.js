var mysql=require('mysql');
var exec=require('child_process').exec;
var conn=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'cluster_manager_dev',
    port:3306
});
conn.query('select * from host_info where host = "64v2.mzhen.cn"',function(err,result){
    if(err){
        console.log(err); 
    }        
    else{
/*
        for(var i=0;i<result.length;i++){
            console.log(result[i]); 
            console.log(result[i].role_name);
            temp.(result[i].role_name)=result[i].host;
        }
*/
		for(var temp in result[0]) {
			console.log(temp);	
			console.log(result[0][temp]);
		}
		return;
    }
});

