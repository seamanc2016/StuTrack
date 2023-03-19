//studentserver.js

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('./config.js');
const uri = `mongodb+srv://${config.db.user}:${config.db.pass}@${config.db.host}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

/** 
* POST - Creates a student resource.
* @method /students
* @param {string} Request.body.fname - The student's first name. 
* @param {string} Request.body.lname - The student's last name. 
* @param {string} Request.body.gpa - The student's GPA. 
* @param {boolean} Request.body.enrolled - The student's enrollement status. 
* @return {Response} Status 201 on successful creation. Status 204/208 on creation failures.
*/
app.post('/students', function (req, res) {
  var id = new Date().getTime();
  var obj = {};

  //Create student object
  obj._id = String(id);
  obj.fname = req.body.fname;
  obj.lname = req.body.lname;
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled === "true" ? true : false;

  //Get collection instance
  const coll = client.db(config.db.name).collection(config.db.collection);

  //Check if document with same full name already exists
  query = {
    $and: [
      { fname: obj.fname },
      { lname: obj.lname }
    ]
  }
  coll.findOne(query)
    .then(
      (findResult) => {
        if (findResult != null) {
          return res.status(208).send({ message: `A record for ${obj.fname} ${obj.lname} already exists.` });
        }
        else {
          //Insert document into collection
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
      }
    );
}); //end post method


/** 
* GET - Retrieves a student resource by ID.
* @method /students/:id
* @param {string} Request.params.id The student's ID.
* @return {Response} Status 200 on success. Status 404 on failure.
*/
app.get('/students/:id', function (req, res) {
  var id = req.params.id;

  fs.readFile("students/" + id + ".json", "utf8", function (err, data) {
    if (err) {
      var rsp_obj = {};
      rsp_obj.id = id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      return res.status(200).send(data);
    }
  });
});

function readFiles(files, arr, res) {
  fname = files.pop();
  if (!fname)
    return;
  fs.readFile(fname, "utf8", function (err, data) {
    if (err) {
      return res.status(500).send({ "message": "error - internal server error" });
    } else {
      arr.push(JSON.parse(data));
      if (files.length == 0) {
        var obj = {};
        obj.students = arr;
        obj.message = "No data found";
        return res.status(200).send(obj);
      } else {
        readFiles(files, arr, res);
      }
    }
  });
}

/** 
* GET - Retrieve all student resources.
* @method /students
* @return {Response} Status 200 on success. Status 500 on failure.
*/
app.get('/students', function (req, res) {
  var obj = {};
  var arr = [];
  filesread = 0;

  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({ "message": "error - internal server error" });
    }

    if (files.length == 0) {
      obj.students = arr;
      obj.message = "No data found";
      return res.status(200).send(obj);
    }
    readFiles(files, [], res);
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
* @returns {Response} Status 201 on update success. Status 206 on update failure. Status 500 on server error.
*/
app.put('/students/:id', function (req, res) {
  var id = req.params.id;
  var obj = {};

  //Create student object
  obj._id = id;
  obj.fname = req.body.fname;
  obj.lname = req.body.lname;
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled === "true" ? true : false;

  //Get collection instance
  const coll = client.db(config.db.name).collection(config.db.collection);

  //Update the document that matches the passed student ID
  const filter = {
    _id: obj._id,
  };
  const update = {
    $set: {
      fname: obj.fname,
      lname: obj.lname,
      gpa: obj.gpa,
      enrolled: obj.enrolled,
    }
  }

  coll.updateOne(filter, update)
    .then(
      (resolve) => {
        if (resolve.matchedCount == 0)
          return res.status(206).send({ message: `There is no record belonging to ID: ${obj._id}` });
        else
          return res.status(201).send({ message: `Record belonging to ID: ${obj._id} updated.` });
      },
      (error) => {
        return res.status(500).send({ message: `A server error occured when updating. Try again later.` });
      }
    );
}); //end put method


/** 
* DELETE - Deletes a student resource.
* @method /students/:id
* @param {string} Request.params.id - The student's ID. 
* @return {Response} Status 200 on success. Status 404 on failure.
*/
app.delete('/students/:id', function (req, res) {
  var id = req.params.id;
  var fname = "students/" + id + ".json";

  fs.unlink(fname, function (err) {
    var rsp_obj = {};
    if (err) {
      rsp_obj.id = id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      rsp_obj.id = id;
      rsp_obj.message = 'record deleted';
      return res.status(200).send(rsp_obj);
    }
  });

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
  res.render(path.join(__dirname, 'views/index.ejs'), { pageName: 'home' })
})

app.listen(config.server.port); //start the server
console.log('Server is running...');