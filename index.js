const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
var jwt = require('jsonwebtoken');

var cookieParser = require('cookie-parser')
const app = express()
const port = 5000

const secreckey = "hello there"

// middleware 
const corsOptions = {
  origin: '*',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}

// parser 
app.use(express.json());
app.use(cookieParser());

// verify token
const gateman = (req, res, next) => {
  const { token } = req.cookies;
  // console.log(token);

  //client does not send token
  if (!token) {
    return res.status(401).send({ message: "you are not authorized" })
  }
  // verify a token symmetric
  jwt.verify(token, secreckey, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "you are not authorized" })
    }

    // attach decoded user so that everyone can get token email 
    req.user = decoded;
    next();
  });


}


//db url
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.slqgxau.mongodb.net/taskManager?retryWrites=true&w=majority&appName=Cluster0`;

// mongodb connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //connect collection
    const taskCollection = client.db('taskManager').collection('tasks')


    app.get('/api/tasks', gateman, async (req, res) => {

      let query = {};
      let options = {};
      const email = req.query.email;

      // suthorization
      const tokenEmail = req.user.email;
      if (email === tokenEmail) {

        if (email) {
          query = { userEmail: email }
        }

        const tasks = await taskCollection.find(query, options).toArray();

        const completedTask = tasks.filter(task => task.status === "completed")
        const uncompletedTask = tasks.filter(task => task.status === "uncompleted")

        res.send({ completed: completedTask, uncompleted: uncompletedTask })
      }
      else {
        return res.status(403).send({ message: "Forbidden access" })
      }
    })


    app.get('/api/task/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const cursor = taskCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })


    app.get('/api/tasks/:email', gateman, async (req, res) => {
      let query = {};
      const queryEmail = req.params.email;
      // suthorization
      const tokenEmail = req.user.email;
      if (queryEmail === tokenEmail) {
        query = { userEmail: queryEmail }

        const cursor = taskCollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
      }
      else {
        return res.status(403).send({ message: "Forbidden access" })
      }


    })




    app.post('/api/tasks', async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result)
    })

    app.delete('/api/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    })
    app.patch('/api/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const updatedTask = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: updatedTask.title,
          description: updatedTask.description,
          date: updatedTask.date,
          status: updatedTask.status,
        }
      }
      const result = await taskCollection.updateOne(query, updatedDoc);
      res.send(result)
    })

    app.post('/api/auth/access-token', async (req, res) => {
      //send access token to browser
      const user = req.body;
      const token = jwt.sign(user, secreckey, { expiresIn: 60 * 60 });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      }).send({ 'success': true })
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})