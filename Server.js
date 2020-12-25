const express = require('express');
const app = express();
const session = require('cookie-session');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const formidable = require('formidable');
const mongourl = '';
const dbName = 'NULL';

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
/*-------------------------RESTful-----------------------------------------------*/
app.get('/api/restaurant/name/:name', (req,res) => {
    if (req.params.name) {
        let criteria = {};
        criteria['name'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);

            findDocument(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing name"});
    }
})

app.get('/api/restaurant/borough/:borough', (req,res) => {
    if (req.params.borough) {
        let criteria = {};
        criteria['borough'] = req.params.borough;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);

            findDocument(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing borough"});
    }
})

app.get('/api/restaurant/cuisine/:cuisine', (req,res) => {
    if (req.params.cuisine) {
        let criteria = {};
        criteria['cuisine'] = req.params.cuisine;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);

            findDocument(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing cuisine"});
    }
})

/*------------------Routing------------------------------------------------------*/
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
	const client = new MongoClient(mongourl, { useNewUrlParser: true });
	client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);
		findDocument(db,req.query.docs, (docs) => {
			res.status(200).render("read",{user:req.session.id,noOfRestaurant:docs.length,restaurants:docs});
		});
	});
});

app.get("/createRestaurant", (req,res) => {
	res.status(200).render("create",{});	
});

app.post("/createRestaurant", (req,res) => {
	const form = new formidable.IncomingForm(); 
	form.parse(req, (err, fields, files) => {
        	var doc = {
		"restaurant_id":null,
		"name":null,
		"borough": null,
		"cuisine": null,
		"photo":null,
		"mimetype":null,
		"address": {
            		"building": null,
            		"street": null,
            		"zipcode": null,
	    		"coord": [null,null]
        		}, 
		"grades": [],
		"restaurant_id": null,
        	"owner": null
		};
		doc['restaurant_id'] = fields.restaurant_id;
		doc['name'] = fields.name;
		doc['borough'] = fields.borough;
		doc['cuisine'] = fields.cuisine;
		doc['address']['building'] = fields.building;
        doc['address']['street'] = fields.street;
        doc['address']['zipcode']= fields.zipcode;
        doc['address']['coord'] = [fields.lon,fields.lat];
        doc['owner'] = req.session.id;
        	
		if (files.photo.size > 0) {
			fs.readFile(files.photo.path, (err,data) => {
				assert.equal(err,null);
				doc['photo'] = new Buffer.from(data).toString('base64');
				doc['mimetype'] = files.photo.type;
				insertDocument(doc, () => {
        			res.redirect('/read');
    			})
			})
		}else{
			insertDocument(doc, () => {
        		res.redirect('/read');
    		})
		}
	})
}); 

app.get('/display', (req,res) => {
	const client = new MongoClient(mongourl, { useNewUrlParser: true });
	client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);
		let DOCID = {};
		DOCID['_id'] = ObjectID(req.query._id)
		findDocument(db,DOCID, (docs) => {
			client.close();
			res.status(200).render("display",{restaurant:docs[0],user:req.session.id});	
		});
	});
	
});

app.get('/edit', (req,res) => {
	const client = new MongoClient(mongourl, { useNewUrlParser: true });
	client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);
		let DOCID = {};
		DOCID['_id'] = ObjectID(req.query._id)
		findDocument(db,DOCID, (docs) => {
			client.close();
			res.status(200).render("edit",{restaurant:docs[0]});	
		});
	});
	
});

app.post('/edit', (req,res) => {
	const form = new formidable.IncomingForm(); 
	form.parse(req, (err, fields, files) => {
		var DOCID = {};
		DOCID['_id'] = ObjectID(req.query._id);
		var updateDoc = {};
		updateDoc['restaurant_id'] = fields.restaurant_id;
		updateDoc['name'] = fields.name;
		updateDoc['borough'] = fields.borough;
		updateDoc['cuisine'] = fields.cuisine;
		updateDoc['address'] = {};
		updateDoc['address']['building'] = fields.building;
		updateDoc['address']['street'] = fields.street;
		updateDoc['address']['zipcode']= fields.zipcode;
		updateDoc['address']['coord'] = [fields.lon,fields.lat];
        	
		if (files.photo.size > 0) {
			fs.readFile(files.photo.path, (err,data) => {
				assert.equal(err,null);
				updateDoc['photo'] = new Buffer.from(data).toString('base64');
				updateDoc['mimetype'] = files.photo.type;
				updateDocument(DOCID,updateDoc, () => {
        			res.redirect('/display?_id=' + req.query._id);
    			})
			})
		}else{
			updateDocument(DOCID,updateDoc, () => {
        		res.redirect('/display?_id=' + req.query._id);
    		})
		}
	})
});

app.get("/rate", (req,res) => {
var isRated = false;
const client = new MongoClient(mongourl, { useNewUrlParser: true });
	client.connect((err) => {
        	assert.equal(null, err);
        	const db = client.db(dbName);
			let DOCID = {};
			DOCID['_id'] = ObjectID(req.query._id)
			findDocument(db,DOCID, (docs) => {
				client.close();
				docs[0].grades.forEach((grade)=>{
					if(grade.user == req.session.id){
						isRated = true;
					}
				});
				if(isRated){
					res.status(200).render("rated");
				}else{
					res.status(200).render("rate",{id:req.query._id});
				}	
			});
	});
});


app.post('/rate', (req,res) => {
	
	const form = new formidable.IncomingForm(); 
	form.parse(req, (err, fields) => {
		var DOCID = {};
		DOCID['_id'] = ObjectID(req.query._id);
		var newRating = {};
		newRating['user'] = req.session.id;
		newRating['score'] = fields.score;


			rateRestaurant(DOCID, newRating, () => {
 				res.redirect('display?_id=' + req.query._id);
			});
	});
});


app.get("/rated", (req,res) => {

	res.status(200).render("rated");	
});

app.get("/delete", (req,res) => {
	var DOCID = {};
	DOCID['_id'] = ObjectID(req.query._id);
	const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
    
        deleteDocument(db, DOCID, (results) => {
            client.close();
            res.status(200).render("del");	
        });
    });
});

app.get("/map", (req,res) => {

res.render("map", {
		lat:req.query.lat,
		lon:req.query.lon,
		zoom:req.query.zoom ? req.query.zoom : 15
	});
	res.end();

});

app.get("/search", (req,res) => {
	res.status(200).render("search");	
});

app.post("/search", (req,res) => {
	const form = new formidable.IncomingForm(); 
	form.parse(req, (err, fields) => {
		var criteria = {};
		if(fields.name)
			criteria['name'] = fields.name;
		if(fields.borough)
			criteria['borough'] = fields.borough;
		if(fields.cuisine)
			criteria['cuisine'] = fields.cuisine;

//If no search keyword inputed, show 0 resturant instead of  all resturant  
	if(!fields.name&&!fields.borough&&!fields.cuisine){
		criteria['name'] = '';
	}

		const client = new MongoClient(mongourl, { useNewUrlParser: true });
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);

            findDocument(db, criteria, (docs) => {
                client.close();
				res.status(200).render("searchResult",{restaurants:docs,name:fields.name,borough:fields.borough,cuisine:fields.cuisine});	
            });
        });
	});
});


app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});
/*------------------------------------------------------------------------*/
const insertDocument = (doc, callback) => {
	const client = new MongoClient(mongourl, { useNewUrlParser: true });
	client.connect((err) => {
		assert.equal(null, err);
		const db = client.db(dbName);
		db.collection('restaurant').insertOne(doc, (err, results) => {
			client.close();
        		assert.equal(err,null);
        		//console.log(`Inserted document(s): ${results.insertedCount}`);
        		callback();
    		});
	})
}

const findDocument = (db,criteria, callback) => {
	let cursor = db.collection('restaurant').find(criteria);
	cursor.toArray((err,docs) => {
		assert.equal(err,null);
		callback(docs);
    });
}

const updateDocument = (criteria, updateDoc, callback) => {
    const client = new MongoClient(mongourl, { useNewUrlParser: true });
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);

         db.collection('restaurant').updateOne(criteria,{$set : updateDoc},
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );
    });
}

const rateRestaurant = (criteria, newRating, callback) => {
    const client = new MongoClient(mongourl, { useNewUrlParser: true });
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);
		db.collection('restaurant').updateOne(criteria,
			{$push: { grades: newRating } }, (err, result) => {
			client.close();
            assert.equal(err, null);
            callback();
		});
    });
}

const deleteDocument = (db, criteria, callback) => {
    db.collection('restaurant').deleteOne(criteria, (err,results) => {
        assert.equal(err,null);
        callback(results);
    })
}

app.listen(process.env.PORT || 8099);



