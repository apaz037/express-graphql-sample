var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

//  Let's make a schema
var schema = buildSchema(`
type Query {
    hello: String,

    quoteOfTheDay: String
    random: Float!
    rollThreeDice: [Int]

    rollDice(numDice: Int!, numSides: Int): [Int]
}
`);

//  The root will provider resolver functions for each API endpoint
var root = {
    hello: () => {
        return 'Hello World';
    },

    quoteOfTheDay: () => {
        return Math.random() < .5 ? 'Quote 1' : 'Quote 2';
    },

    random: () => {
        return Math.random();
    },

    rollThreeDice: () => {
        return [1, 2, 3].map(_ => 1 + Math.floor(Math.random() * 6));
    },


    // Sample call while passing parameters
    //  { rollDice(numDice: 3, numSides: 8) }
    rollDice: function({ numDice, numSides }) {
        var output = [];
        for (var i = 0; i < numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)));
        }
        return output;
    }
};

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}))

app.listen(4000);
console.log('Running a GraphQL API server on localhost:4000/graphql');