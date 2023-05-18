//studentserver.js
const express = require('express');
const app = express();
const dotenv = require('dotenv').config('env');
const bodyParser = require('body-parser');
const path = require("path");
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'images')));
app.set("view engine", "ejs");

/** 
* POST - Creates a student resource.
* @method /students
* @param {string} Request.body.fname - The student's first name. 
* @param {string} Request.body.lname - The student's last name. 
* @param {string} Request.body.gpa - The student's GPA. 
* @param {boolean} Request.body.enrolled - The student's enrollement status. 
* @return {Response} Status 201 on successful creation. Status 204/208 on creation failures. Status 400 on client error. Status 500 on server error.
*/
app.post('/students', function (req, res) {
  //Handle undefined param/body vars
  if (req.body.fname == undefined || req.body.lname == undefined || req.body.gpa == undefined || req.body.enrolled == undefined)
    return res.status(400).send({ message: 'The body param(s) fname, lname, gpa and/or enrolled is/are undefined.' });

  var id = new Date().getTime();
  var obj = {};

  //Create student object
  obj._id = String(id);
  obj.fname = req.body.fname.toUpperCase();
  obj.lname = req.body.lname.toUpperCase();
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled === "true" ? true : false;

  //Get collection instance
  const coll = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLL_NAME);

  //Generate the query object
  query = { $and: [{ fname: obj.fname }, { lname: obj.lname }] };

  //Determine if the document for that student already exists
  coll.findOne(query)
    .then(
      (resolve) => {
        //It already existed
        var findResult = resolve;
        if (findResult != null) {
          return res.status(208).send({ message: `A record for ${obj.fname} ${obj.lname} already exists.` });
        }
        else {
          //It doesn't exist so insert document into collection
          coll.insertOne(obj)
            .then(
              (resolve) => {
                return res.status(201).send({ message: `New record created for ${obj.fname} ${obj.lname}.` });
              },
              (error) => {
                return res.status(204).send({ message: `Unable to create record. Please try again later.` });
              }
            );
        }
      },
      (error) => { return res.status(500).send(`${error}`); } //Server error
    );
}); //end post method


/** 
* GET - Retrieves a student resource by ID.
* @method /students/:id
* @param {string} Request.params.id The student's ID.
* @return {Response} Status 200/304 on retrieval success. Status 500 on server error.
*/
app.get('/students/:id', function (req, res) {
  //Get params
  var id = req.params.id;

  //Get collection instance
  const coll = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLL_NAME);

  //Generate the query object
  query = { _id: { $eq: id } };

  //Get the document matching the query
  coll.findOne(query)
    .then(
      (resolve) => {
        var findResult = resolve;
        if (findResult != null) {
          return res.status(200).send(findResult); //a match was found
        }
        else {
          return res.status(200).send({ message: `There is no record belonging to ID: ${id}` });
        }
      },
      (error) => {
        return res.status(500).send(`${error}`); //server error
      });
});

/** 
* GET - List and search through student resources.
* @method /students
* @param {string} Request.query.fname - The student's first name. 
* @param {string} Request.query.lname - The student's last name. 
* @return {Response} Status 200/304 on retrieval success. Status 400 on client error. Status 500 on server error.
*/
app.get('/students', function (req, res) {
  //Renaming params
  var fname = req.query.fname.toUpperCase();
  var lname = req.query.lname.toUpperCase();

  //Get collection instance
  const coll = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLL_NAME);

  //Generate query object if...
  //only first name sent
  if (fname != "" && lname == "")
    var query = { fname: fname };
  //only last name sent
  else if (fname == "" && lname != "")
    var query = { lname: lname };
  //full name sent
  else if (fname != "" && lname != "")
    var query = { $and: [{ fname: fname }, { lname: lname }] };
  //neither a first name nor a last name was sent
  else
    var query = {};

  //Get all documents based on query and return them in response.
  coll.find(query).toArray()
    .then(
      (resolve) => {
        var findResult = resolve;
        return res.status(200).send(findResult); //a match was found
      },
      (error) => {
        return res.status(500).send(`${error}`); //server error
      });
});


/** 
* PUT - Updates a student resource.
* @method /students/:id
* @param {string} Request.params.id - The student's ID. 
* @param {string} Request.body.fname - The student's first name. 
* @param {string} Request.body.lname - The student's last name. 
* @param {string} Request.body.gpa - The student's GPA. 
* @param {boolean} Request.body.enrolled - The student's enrollement status.
* @returns {Response} Status 201 on update success. Status 206 on update failure. Status 400 on client error. Status 500 on server error.
*/
app.put('/students/:id', function (req, res) {
  //Handle undefined param/body vars
  if (req.body.fname == undefined || req.body.lname == undefined || req.body.gpa == undefined || req.body.enrolled == undefined)
    return res.status(400).send({ message: 'The body param(s) fname, lname, gpa and/or enrolled is/are undefined.' });
    
  //Get params and body vars
  var id = req.params.id;
  var fname = req.body.fname.toUpperCase();
  var lname = req.body.lname.toUpperCase();
  var gpa = req.body.gpa;
  var enrolled = req.body.enrolled === "true" ? true : false;

  //Get collection instance
  const coll = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLL_NAME);

  //Setting MongoDB updateOne parameters
  const filter = { _id: id, }; //Filter by id
  const update = { //Data to be updated
    $set: {
      fname: fname,
      lname: lname,
      gpa: gpa,
      enrolled: enrolled,
    }
  }

  //Find the document matching the filter and update it
  coll.updateOne(filter, update)
    .then(
      (resolve) => {
        if (resolve.matchedCount == 0) //No record found
          return res.status(206).send({ message: `There is no record belonging to ID: ${id}` });
        else //Record was found
          return res.status(201).send({ message: `Record belonging to ID: ${id} updated.` });
      },
      (error) => {
        return res.status(500).send(`${error}`); //server error
      }
    );
}); //end put method


/** 
* DELETE - Deletes a student resource.
* @method /students/:id
* @param {string} Request.params.id - The student's ID. 
* @return {Response} Status 200 on deletion success. Status 206 on deletion failure. Status 500 on server error.
*/
app.delete('/students/:id', function (req, res) {
  //Get params
  var id = req.params.id;

  //Get collection instance
  const coll = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLL_NAME);

  //Setting MongoDB deleteOne parameters
  const filter = { _id: id, }; //Filter by id

  //Find the document matching the filter and delete it
  coll.deleteOne(filter)
    .then(
      (resolve) => {
        if (resolve.deletedCount == 0) //No document found
          return res.status(206).send({ message: `There is no record belonging to ID: ${id}` });
        else //Document found
          return res.status(200).send({ message: `Record belonging to ID: ${id} deleted.` });
      },
      (error) => {
        return res.status(500).send(`${error}`); //server error
      }
    );

}); //end delete method


//Frontend endpoints
app.get("/add", function (req, res) {
  res.render(path.join(__dirname, 'views/addStudent.ejs'), { pageName: 'add' })
})

app.get("/update", function (req, res) {
  res.render(path.join(__dirname, 'views/updateStudent.ejs'), { pageName: 'update' })
})

app.get("/delete", function (req, res) {
  res.render(path.join(__dirname, 'views/deleteStudent.ejs'), { pageName: 'delete' })
})

app.get("/find", function (req, res) {
  res.render(path.join(__dirname, 'views/displayStudent.ejs'), { pageName: 'find' })
})

app.get("/all", function (req, res) {
  res.render(path.join(__dirname, 'views/listStudents.ejs'), { pageName: 'all' })
})

app.get("/", function (req, res) {
  res.render(path.join(__dirname, 'views/index.ejs'), { pageName: 'home', classroomPNG: '/classroom.png'})
})

app.listen(process.env.PORT || 5678); //start the server
console.log('Server is running...');