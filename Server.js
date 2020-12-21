const express = require('express');
const app = express();


var msg='';
var user='';
const accounts = [
	{name: 'demo', password: ''},
	{name: 'student', password: ''}
];

const authenticateUser = (id = null, password = null) => {
if(id=='' && password==''){
	msg='Incorrect userid or password!';
	return true;
}
for(let x of accounts){
	if(x.name==id && x.password==password){
	msg='';
	user=id;
	return false;
	}
}
return true;
}

/*let today = new Date();
    let msg = (name != null) ? 'Hello ' + name + '! ' : 'Hello there!';
    if (includeTime) {
      msg += `  It is now ${today.toTimeString()}`;
    }
    return(msg);*/

app.set('view engine', 'ejs');

app.get("/", (req,res) => {
	res.status(200).render("login",{msg:msg});	
});

app.get("/processlogin", (req,res) => {
	if(authenticateUser(req.query.id,req.query.password)){
	res.redirect('/');
	}else
	res.redirect('/read');
});

app.get("/read", (req,res) => {
	res.status(200).render("read",{user:user});	
});
app.listen(process.env.PORT || 8099);



