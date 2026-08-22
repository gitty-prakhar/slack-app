export const swaggerDocument={
    openapi:"3.0.0",
    info:{
        title:"Slackr API",
        version:"1.0.0",
        description:"API documentation for the Slackr backend"
    },
    servers:[
        {
            url:"http://localhost:8000/api/v1"
        }
    ],
    components:{
        securitySchemes:{
            bearerAuth:{
                type: "http",
                scheme:"bearer",
                bearerFormat:"JWT"
            }
        }
    },
    security:[
        {
            bearerAuth:[]
        }
    ],
    paths:{
        "/users/register":{
            post:{
                summary:"Register a new user",
                tags:["Users"],
                security:[],
                requestBody:{
                    required:true,
                    content:{
                        "application/json":{
                            schema:{
                                type:"object",
                                properties:{
                                    email:{type:"string"},
                                    username:{type:"string"},
                                    password:{type:"string"}
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": { description: "User registered successfully" }
                }
            }
        },
        "/users/login": {
            post: {
                summary: "Login a user",
                tags: ["Users"],
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    username: { type: "string" },
                                    email: { type: "string" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "User logged in successfully" }
                }
            }
        },
        "/users/me":{
            get:{
                summary:"Get current logged-in user",
                tags:["Users"],
                responses:{
                    "200":{ description:"Successfully fetched current user" },
                    "401":{ description:"Unauthorized" }
                }
            }
        },
        "/workspaces":{
            get: {
                summary: "Get all workspaces for the current user",
                tags: ["Workspaces"],
                responses: {
                    "200": { description: "Successfully fetched user workspaces" }
                }
            },
            post:{
                summary:"Create a new workspace",
                tags:["Workspaces"],
                requestBody:{
                    required:true,
                    content:{
                        "application/json":{
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": { description: "Workspace created successfully" }
                }
            }
        },
        "/channels/workspace/{workspaceId}": {
            get: {
                summary: "Get all channels in a workspace",
                tags: ["Channels"],
                parameters: [
                    { name: "workspaceId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": { description: "Successfully fetched channels" }
                }
            }
        },
        "/messages/{channelId}": {
            get: {
                summary: "Get messages for a channel",
                tags: ["Messages"],
                parameters: [
                    { name: "channelId", in: "path", required: true, schema: { type: "string" } },
                    { name: "page", in: "query", schema: { type: "integer" } },
                    { name: "limit", in: "query", schema: { type: "integer" } }
                ],
                responses: {
                    "200": { description: "Successfully fetched messages" }
                }
            }
        }
    }
};
