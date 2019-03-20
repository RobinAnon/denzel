const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const CONNECTION_URL = "mongodb+srv://Robin1:Robin1@cluster0-ehu8h.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "Denzel";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(process.env.PORT, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("DenzelCollection");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/movies/populate", async (request, response) => {
    try {
      const movies = await imdb(DENZEL_IMDB_ID);
      collection.insertMany(movies);
      result = {
        "total": movies.length
      };
      response.send(result);
    } catch (e) {
      console.error(e);
      return response.status(500).send("Error trying to populate the database");
    }
});


app.get("/movies", (request, response) => {
    collection.find({"metascore": {$gte: 70}}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result[Math.floor(Math.random() * result.length)]);
    });
});

app.get("/movies/search", (request, response) => {
    var limit = (request.query.limit === undefined ? 5 : parseInt(request.query.limit));
    var metascore = (request.query.metascore === undefined ? 0 : parseInt(request.query.metascore));

    collection.find({"metascore": {$gte: metascore}}).limit(limit).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.get("/movies/:id", (request, response) => {
    collection.findOne({ "id": request.params.id }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.post("/movies/:id", (request, response) => {
    if(request.body.review === undefined || request.body.date === undefined) {
        return response.status(400).send("You have to specify review and date");
    }
    collection.update({"id": request.params.id}, {$set: {"date": request.body.date, "review": request.body.review}}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
    });
    collection.findOne({"id": request.params.id}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        result = {
          "_id": result._id
        };
        response.send(result);
    });
});