const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('uploads'));
app.use(fileUpload());

const port = 5000;



const uri = "mongodb+srv://creativeAgency:maimoona@cluster0.mbwlu.mongodb.net/creativeAgencyDB?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
  const clientCollection = client.db("creativeAgencyDB").collection("services");
  const clientReviewCollection = client.db("creativeAgencyDB").collection("customerReview");
  const adminCollection = client.db("creativeAgencyDB").collection("servicesAddByAdmin");
  const userRoleCollection = client.db("creativeAgencyDB").collection("userRole");
  console.log("DB connected successfully");
 
  // client's Database
  app.post('/orderService', (req, res) => {
    const status = "Pending";
    const name = req.body.name;
    const email = req.body.email;
    const serviceId = req.body.serviceId;
    const serviceTitle = req.body.serviceTitle;
    const projectDescription = req.body.projectDescription;
    const file = req.files.file;
    const newImg = file.data;
    const encImg = newImg.toString('base64');
    
    var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };

    clientCollection.insertOne({name, email, serviceId,serviceTitle, projectDescription, status, image})
    .then(result => {
        res.send(result.insertedCount > 0);
    })

  });

  //post customer review
  app.post('/review', (req, res) => {
    const name = req.body.name;
    const company = req.body.company;
    const review = req.body.review;
    const file = req.files.file;
    const newImg = file.data;
    const encImg = newImg.toString('base64');
    
    var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };
    console.log(name, company, review, image);
    clientReviewCollection.insertOne({name, company, review, image})
    .then(result => {
        res.send(result.insertedCount > 0);
    })

  });

  //show all reviews 
  app.get('/allReviews', (req, res) => {
    clientReviewCollection.find({})
    .toArray((err, documents) => {
        res.send(documents);
    })
  });

  //show all services to admin 
  app.get('/allServices', (req, res) => {
    clientCollection.find({})
    .toArray((err, documents) => {
        res.send(documents);
    })
  });

  //customer own services  
  app.get('/ownServices', (req, res) => {
    adminCollection.aggregate([
      { "$addFields": { "serviceId": { "$toString": "$_id" }}},
      {
        
        $lookup:
        {  
          from: "services",
          localField: "serviceId",
          foreignField: "serviceId",
          as: "user_services"
        }
      },
      { $match: { "user_services":  {$ne: []} }},
      // {
      //   $match: { $user_services : [{ email: req.query.email }] }
      // }
    ]
    ).toArray((err, documents) => {
          console.log(req.query.email)
          console.log(documents);
          console.log(documents[0].user_services);
          console.log(documents[0].user_services[0].status);
          res.send(documents);
      })

    // clientCollection.find({"email": req.query.email})
    // .toArray((err, documents) => {
    //     console.log(documents);
    //     res.send(documents);
    // })
  });


  //------------Admin's Database------------------

  //add service in db
  app.post('/addService', (req, res) => {
    const title = req.body.title;
    const serviceDescription = req.body.serviceDescription;
    const file = req.files.file;
    const newImg = file.data;
    const encImg = newImg.toString('base64');
    
    var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };

    adminCollection.insertOne({title, serviceDescription, image})
    .then(result => {
        res.send(result.insertedCount > 0);
    })
  });

  //show all services
  app.get('/allServicestohome', (req, res) => {
      adminCollection.find({})
      .toArray((err, documents) => {
          res.send(documents);
      })
  });

  //search service title
  app.get('/searchTitle', (req, res) => {
      adminCollection.find({"_id" : ObjectId(req.query.id)})
      .toArray((err, documents) => {
        res.send(documents);
    })
  })

  //add role as admin in db
  app.post('/addAdmin', (req, res) => {
    const role = "admin";
    const email = req.body.email;
    value_to_update = {"email":email}
    updated_value = { $set: {"email":email,"role":role}};
    userRoleCollection.updateOne(value_to_update,updated_value,{upsert : true})
    
  })

    //add role in db
  app.post('/addUser', (req, res) => {
    console.log(req.body)
    const email = req.body.em;
    const role = "user";
    key = {"email":email}
    value = {"email":email,"role":role}
    userRoleCollection.find( { "email": email } )
    .toArray((err, documents) => {
      console.log(documents.length)
      if(documents.length == 0){
        userRoleCollection.insertOne({email,role})
      }
    })
      //console.log(userRoleCollection.find( { "email": email } ).count())
      //userRoleCollection.updateOne(key, { $set: value}, upsert=true)
      // userRoleCollection.insertOne({email,role})
      // .then(result => {
      //     res.send(result.insertedCount > 0);
      // })
    });

    app.post('/getRole', (req, res) => {
      const email = req.body.user;
      userRoleCollection.find( { "email": email } )
      .toArray((err, documents) => {
        res.send(documents);
      })
    })










});










app.get('/', (req, res) => {
    res.send("hello from server....");
})

app.listen(process.env.PORT || port);