import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import AWS from 'aws-sdk'
//For env File 
dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const bodyParser = require('body-parser');

const lambda = new AWS.Lambda()

const app: Application = express();

app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 8000;

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server');
});

app.post('/solutions', async (req: Request, res: Response) => {
  const payload = req.body;
  console.log(req, req.body)
  const params = {
    FunctionName: "boogle-app",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(payload)
  }

  const result = await lambda.invoke(params).promise()
  const response = JSON.parse(JSON.stringify(result.Payload!))
  const body = JSON.parse(response).body;

  console.log(body)
  res.status(200).send(body)
})

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
