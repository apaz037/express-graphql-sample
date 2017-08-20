var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

//  Let's make a schema
var schema = buildSchema(`
input MessageInput {
    content: String
    author: String
}

type Query {
    hello: String,
    quoteOfTheDay: String
    random: Float!
    rollThreeDice: [Int]
    rollDice(numDice: Int!, numSides: Int): [Int]
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
    ip: String
}

type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
}

type Message {
    id: ID!
    content: String
    author: String
}

type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
}
`);

function loggingMiddleware(req, res, next) {
    console.log('ip:', req.ip);
    next();
}

class RandomDie {
    constructor(numSides) {
        this.numSides = numSides;
    }

    rollOnce() {
        return 1 + Math.floor(Math.random() * this.numSides);
    }

    roll({ numRolls }) {
        var output = [];
        for (var i = 0; i < numRolls; i++) {
            output.push(this.rollOnce());
        }
        return output;
    }
}

class Message {
    constructor(id, { content, author }) {
        this.id = id;
        this.content = content;
        this.author = author;
    }
}

var fakeDatabase = {};

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
    },

    getDie: function({ numSides }) {
        return new RandomDie(numSides || 6);
    },

    getMessage: function({ id }) {
        if (!fakeDatabase[id]) {
            throw new Error('no message exists with id ' + id);
        }
        return new Message(id, fakeDatabase[id]);
    },

    createMessage: function({ input }) {
        //  Create a random ID for the fakeDatabase
        var id = require('crypto').randomBytes(10).toString('hex');

        fakeDatabase[id] = input;
        return new Message(id, input);
    },

    updateMessage: function({ id, input }) {
        if (!fakeDatabase[id]) {
            throw new Error('no message exists with id ' + id);
        }
        fakeDatabase[id] = input;
        return new Message(id, input);
    },

    ip: function(args, request) {
        return request.ip;
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