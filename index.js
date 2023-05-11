const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized User' });
    }
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        else {
            req.decoded = decoded;
            next();
        }
    })
}

const uri = `mongodb+srv://geniusUser:lMLGCPdYOU4TUHEY@cluster0.wugey.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('GeniusCar').collection('services');
        const orderCollection = client.db('GeniusCar').collection('orders');

        // getting all services 
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // getting a single service 
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        // posting service to the database
        app.post('/service', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        // deleting a service from db 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });

        // posting orders data 
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });
        // getting orders data 
        app.get('/order', verifyToken, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
        });

        // posting email from user to generate a token 
        app.post('/access', async (req, res) => {
            const user = req.body;
            const token = await jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({ token });
        });
    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server Setup');
});

app.get('/test', (req, res) => {
    res.send('Testing after deployed in Heroku');
})

app.listen(port, () => console.log('listening to', port));