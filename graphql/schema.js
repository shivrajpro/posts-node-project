const { buildSchema } = require('graphql');

// ! is to make the field required
module.exports = buildSchema(`
    type Post{
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }    

    type User{
        _id:ID!
        username: String!
        email: String!
        password:String
        status:String!
        posts:[Post!]!
    }

    type AuthData{
        token:String!
        userId:String
    }

    type PostData{
        posts:[Post!]!
        totalPosts: Int!
    }

    input UserInputData{
        email:String!
        username:String!
        password:String!
    }

    input PostInputData{
        title:String!
        content:String!
        imageUrl: String!
    }

    type RootMutation{
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
    }

    type RootQuery{
        hello: String
        login(email:String!, password:String): AuthData!
        posts(page:Int): PostData!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)