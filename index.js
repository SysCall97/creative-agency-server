const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5000;
const dbUser = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const adminTbl = process.env.TBL_ADMIN;
const orderTbl = process.env.TBL_ORDER;
const orderFilesTbl = process.env.TBL_ORDER_FILES;
const serviceTbl = process.env.TBL_SERVICE;
const reviewTbl = process.env.TBL_REVIEW;

const uri = `mongodb+srv://${dbUser}:${password}@cluster0.ou4zy.mongodb.net/${dbName}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => res.send("backend is working"));

client.connect(err => {
    const serviceCollection = client.db(dbName).collection(serviceTbl);
    const orderCollection = client.db(dbName).collection(orderTbl);
    const reviewCollection = client.db(dbName).collection(reviewTbl);
    const adminCollection = client.db(dbName).collection(adminTbl);
    const orderFileCollection = client.db(dbName).collection(orderFilesTbl);

    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;

        const encImg = file.data.toString('base64');

        var image = {
            contentype: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encImg, 'base64')
        }

        serviceCollection.insertOne({ name, description, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
            .catch(err => res.send({ msg: "error" }))
    });

    app.post('/addOrder', (req, res) => {
        const info = req.body;

        console.log(info);

        orderCollection.insertOne(info)
            .then(result => res.send(result.insertedCount > 0));
    });

    app.get('/getAllServices', (req, res) => {
        serviceCollection.find({})
            .toArray((err, document) => res.send(document));
    });

    app.get('/getReviews', (req, res) => {
        reviewCollection.find({})
            .toArray((err, document) => res.send(document));
    });


    app.post('/addReview', (req, res) => {
        reviewCollection.insertOne(req.body)
            .then(result => res.send(result.insertedCount > 0));
    });

    app.post('/makeAdmin', (req, res) => {
        adminCollection.insertOne(req.body)
            .then(result => res.send(result.insertedCount > 0));
    });

    app.post('/placeOrder', (req, res) => {
        const file = req.files.file;
        const clientName = req.body.clientName;
        const clientEmail = req.body.clientEmail;
        const serviceName = req.body.serviceName;
        const projectDetails = req.body.projectDetails;
        const price = req.body.price;
        const status = "pending";


        const encFile = file.data.toString('base64');

        var projectFile = {
            contentype: req.files.file.mimetype,
            size: req.files.file.size,
            file: Buffer.from(encFile, 'base64')
        }

        orderCollection.insertOne({ clientName, clientEmail, serviceName, projectDetails, status, price })
            .then(result => {
                const dbFile = {
                    projectFile: projectFile,
                    orderId: result.ops[0]._id
                }
                orderFileCollection.insertOne(dbFile);
                res.send(result.insertedCount > 0);
            })
            .catch(err => res.send({ msg: "error" }));

    });

    app.post('/isAdmin', (req, res) => {
        adminCollection.find({email: req.body.email})
        .toArray((err, document) => res.send(document.length >0));
    })

    app.post('/getOrders', (req, res) => {
        const email = req.body.email;

        console.log(email);

        orderCollection.find({ clientEmail: email })
            .toArray((err, document) => {
                res.send(document);
            });
    });

    app.get('/getAllOrders', (req, res) => {
        orderCollection.find({})
        .toArray((err, document) => {
            res.send(document);
        });
    });

    app.patch('/update/:id', (req, res) => {

        orderCollection.updateMany(
            {_id: ObjectId(req.params.id)},
            {$set: {status: req.body.newStatus}}
        )
        .then(result => res.send(result.modifiedCount > 0));
    })

});


app.listen(process.env.PORT || port);