const express = require('express');
const app = express();
const session = require('cookie-session');
const bodyParser = require('body-parser');

var msg='';

const SECRETKEY = 'John';

const accounts = [
	{id: 'demo', password: ''},
	{id: 'student', password: ''}
];



// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Cookie session for storing login info
app.use(session({
  name: 'loginSession',
  keys: [SECRETKEY]
}));

app.set('view engine', 'ejs');


app.get("/", (req,res) => {
	console.log(req.session);
	if (!req.session.authenticated) {    // user not logged in
		res.status(200).render("login",{msg:msg});
	} else {
		res.redirect('/read');
	}	
});

app.post('/', (req,res) => {

	accounts.forEach((account) => {
		if (account.id == req.body.id && account.password == req.body.password) {
			// correct user name + password
			// store the following name/value pairs in cookie session
			req.session.authenticated = true;        // 'authenticated': true
			req.session.id = req.body.id;	 // 'id': req.body.id
			msg='';		
		}
	});
	if(!req.session.authenticated){
		msg='Wrong userid or password. Please try again.';
	}
	if(req.body.id=='' && req.body.password==''){
	msg='Please enter your userid or password!';
	}
	res.redirect('/');
});

app.get("/read", (req,res) => {
	res.status(200).render("read",{user:req.session.id});	
});

app.get("/createRestaurant", (req,res) => {
	res.status(200).render("create",{});	
});

app.post("/createRestaurant", (req,res) => {
	
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});
app.listen(process.env.PORT || 8099);



