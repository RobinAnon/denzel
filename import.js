const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const CONNECTION_URL = "mongodb+srv://Robin1:Robin1@cluster0-ehu8h.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "Denzel";

const graphqlHTTP = require('express-graphql');
const {GraphQLSchema} = require('graphql');
const { GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
	GraphQLList
} = require('graphql');
const _ = require('lodash');
const movie=require('./type.js').movie;

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;


const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,

            resolve: function () {
                return "Hello World";
            }
        },
        populate:{
          type: GraphQLString,
          resolve: async () => {
            const movies = await imdb(DENZEL_IMDB_ID);
            collection.insertMany(movies, (error, result) => {
                if(error) {
                    return response.status(500).send(error);
                }

            });
            return "done!";
		}},
		  randommovie :{
			  type: movie,
			  resolve: async () => {
				  collection.find({"metascore": {$gte: 70}}).toArray((error, result) => {
						if(error) {
							return response.status(500).send(error);
						}
						const res=response.send(result[Math.floor(Math.random() * result.length)]);
						return res;
					});
							
			
			
									}
		  }
}
		
});
	

	const schema = new GraphQLSchema({ query: queryType });
	
	
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));






	
	app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));






app.listen(process.env.PORT || 9292, () => {
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