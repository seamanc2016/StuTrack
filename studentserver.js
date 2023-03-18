//studentserver.js

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require("glob");
const path = require("path");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine","ejs");

/** 
* POST - Creates a student resource.
* @method /students
* @param {string} Request.body.fname - The student's first name. 
* @param {string} Request.body.lname - The student's last name. 
* @param {string} Request.body.gpa - The student's GPA. 
* @param {boolean} Request.body.enrolled - The student's enrollement status. 
* @return {Response} Status 201 on success. Status 200/500 on failure.
*/
app.post('/students', function(req, res) {
  var id = new Date().getTime();

  var obj = {};
  obj.id = String(id);
  obj.fname = req.body.fname;
  obj.lname = req.body.lname;
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled === "true" ? true : false;

  var str = JSON.stringify(obj, null, 2);

  fs.mkdir("students", {recursive:true}, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error creating directory");
    }
  })


  fs.writeFile("students/" + id + ".json", str, function(err) {
    var rsp_obj = {};
    if(err) {
      rsp_obj.id = -1;
      rsp_obj.message = 'error - unable to create resource';
      return res.status(200).send(rsp_obj);
    } else {
      rsp_obj.id = id;
      rsp_obj.message = 'successfully created';
      return res.status(201).send(rsp_obj);
    }
  }); //end writeFile method


  
}); //end post method


/** 
* GET - Retrieves a student resource by ID.
* @method /students/:id
* @param {string} Request.params.id The student's ID.
* @return {Response} Status 200 on success. Status 404 on failure.
*/
app.get('/students/:id', function(req, res) {
  var id = req.params.id;

  fs.readFile("students/" + id + ".json", "utf8", function(err, data) {
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

function readFiles(files,arr,res) {
  fname = files.pop();
  if (!fname)
    return;
  fs.readFile(fname, "utf8", function(err, data) {
    if (err) {
      return res.status(500).send({"message":"error - internal server error"});
    } else {
      arr.push(JSON.parse(data));
      if (files.length == 0) {
        var obj = {};
        obj.students = arr;
        obj.message = "No data found";
        return res.status(200).send(obj);
      } else {
        readFiles(files,arr,res);
      }
    }
  });  
}

/** 
* GET - Retrieve all student resources.
* @method /students
* @return {Response} Status 200 on success. Status 500 on failure.
*/
app.get('/students', function(req, res) {
  var obj = {};
  var arr = [];
  filesread = 0;

  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({"message":"error - internal server error"});
    }

    if (files.length == 0) {
      obj.students = arr;
      obj.message = "No data found";
      return res.status(200).send(obj);
    }
    readFiles(files,[],res);
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
* @returns {Response} Status 201 on success. Status 200/400 on failure.
*/
app.put('/students/:id', function(req, res) {
  var id = req.params.id;
  var fname = "students/" + id + ".json";
  var rsp_obj = {};
  var obj = {};

  obj.id = id;
  obj.fname = req.body.fname;
  obj.lname = req.body.lname;
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled === "true" ? true : false;;

  var str = JSON.stringify(obj, null, 2);

  //check if file exists
  fs.stat(fname, function(err) {
    if(err == null) {

      //file exists
      fs.writeFile("students/" + id + ".json", str, function(err) {
        var rsp_obj = {};
        if(err) {
          rsp_obj.id = id;
          rsp_obj.message = 'error - unable to update resource';
          return res.status(200).send(rsp_obj);
        } else {
          rsp_obj.id = id;
          rsp_obj.message = 'successfully updated';
          return res.status(201).send(rsp_obj);
        }
      });
      
    } else {
      rsp_obj.id = id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    }

  });

}); //end put method


/** 
* DELETE - Deletes a student resource.
* @method /students/:id
* @param {string} Request.params.id - The student's ID. 
* @return {Response} Status 200 on success. Status 404 on failure.
*/
app.delete('/students/:id', function(req, res) {
  var id = req.params.id;
  var fname = "students/" + id + ".json";

  fs.unlink(fname, function(err) {
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
app.get("/add", function(req, res) {
  res.render(path.join(__dirname, 'views/addStudent.ejs'), {pageName: 'add'})
})

app.get("/update", function(req, res) {
  res.render(path.join(__dirname, 'views/updateStudent.ejs'), {pageName: 'update'})
})

app.get("/delete", function(req, res) {
  res.render(path.join(__dirname, 'views/deleteStudent.ejs'), {pageName: 'delete'})
})

app.get("/find", function(req, res) {
  res.render(path.join(__dirname, 'views/displayStudent.ejs'), {pageName: 'find'})
})

app.get("/all", function(req, res) {
  res.render(path.join(__dirname, 'views/listStudents.ejs'), {pageName: 'all'})
})

app.get("/", function(req, res) {
  res.render(path.join(__dirname, 'views/index.ejs'), {pageName: 'home'})
})

app.listen(5678); //start the server
console.log('Server is running...');