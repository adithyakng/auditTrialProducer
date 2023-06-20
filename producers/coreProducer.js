require("dotenv").config();
const MongoClient = require('mongodb').MongoClient;
const amqp = require('amqplib');
const coreCollections = require("../collectionNames/coreCollections");

let mongoDBClient;
let rabbitMQConnection;
let rabbitMQChannel;
const queue = "core";

async function connectToMongo(){
    try {
        mongoDBClient = new MongoClient(process.env.MONGOURL);
        await mongoDBClient.connect();
        console.log("Connection With MongoDB via mongodb driver established");
        
      } catch (error) {
        console.log(error);
    }
}

async function connectToRabbitMq(){
    try{
        rabbitMQConnection = await amqp.connect(process.env.RABBITMQ);
        rabbitMQChannel = await rabbitMQConnection.createChannel();
        console.log("Connection established with RabbitMQ and channel created");
    }
    catch(error){
        console.log(error);
    }
}

async function createQueue(queueName){
    await rabbitMQChannel.assertQueue(queueName);
}

function getCollectionPipeline(){
    console.log(coreCollections);
    const pipeline = [
        { $match: { "ns.coll" : {$in: coreCollections}}},
    ];
    return pipeline
}

const startProducer = async () => {
    await connectToMongo();
    await connectToRabbitMq();
    await createQueue(queue);
    const collection = mongoDBClient.db('test');
    const changeStreamIterator = collection.watch(getCollectionPipeline(), { fullDocument: 'updateLookup' });

    // Continuously look for events
    while(true){
        // wait for the next event to occur
        const event = await changeStreamIterator.next();
        console.log(event);
        rabbitMQChannel.sendToQueue(queue, Buffer.from(JSON.stringify(event)));
        console.log("Above event sent to queue");
        // Now push this event into rabbitMQ queue
    }
    
}

module.exports = startProducer