const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = 5000

// middleware 
app.use(cors());
app.use(express.json())

//db url
const uri = "mongodb+srv://@cluster0.slqgxau.mongodb.net/taskManager?retryWrites=true&w=majority&appName=Cluster0";

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


    app.get('/api/tasks',async(req,res)=>{

      let query = {};
      let options= {};
      const id = req.query.id;

      if(id){
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid task ID' });
        }
        query = {_id: new ObjectId(id)}
      }

        const cursor = taskCollection.find(query,options);
        const result = await cursor.toArray();
        res.send(result)
    })

    app.post('/api/tasks',async(req,res)=>{
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result)
    })

    app.delete('/api/tasks/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await taskCollection.deleteOne(query);
      res.send(result);
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