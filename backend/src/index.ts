import express, { Express, Request, Response , Application } from 'express';
import dotenv from 'dotenv';
import path from 'path';
//For env File 
dotenv.config();
const _dirname = path.dirname("")
const buildPath = path.join(_dirname , "../../boogle-frontend/build")

const app: Application = express();

app.use(express.static(buildPath))
app.get('/*', function(req, res){
  res.sendFile(
    path.join(__dirname, "../../boogle-frontend/build/index.html"),
    function (err) {
      if (err) {
        res.status(500).send(err)
      }
    }
  )
})

const port = process.env.PORT || 8000;

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server');
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});

