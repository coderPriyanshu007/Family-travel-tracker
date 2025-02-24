import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import { getCode, getNames,getData } from "country-list";

const app = express();
const port = 3000;

//db setup
const db = new pg.Client({
  user: 'postgres',
  database: 'World',
  password: 'kandari007',
  host: 'localhost',
  port: 5432
});
db.connect();

//middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


//variables

let error = '';
let users = [
  { id : 1, name : 'Angela' , color: 'teal'},
  { id :2 , name : 'John', color : 'green'}
]
let currentUserId = 1;


//Fetching countries from db
const getUsers = async () => {
  const result = await db.query('SELECT  * FROM users');
  return result.rows;
}



app.get("/", async (req, res) => {
  let visitedCountries = [];
  const result = await db.query('SELECT * FROM visited_countries WHERE user_id = $1',[currentUserId]);
  const users =  await getUsers();
  result.rows.forEach((country) => {
    visitedCountries.push(country.code);
  })
  console.log(visitedCountries);
  console.log(users);
  
  const currentUser = await db.query('SELECT * FROM users WHERE id = $1',[currentUserId]);
  console.log(currentUser.rows[0]);
  
  
  res.render('index.ejs', {
  total: visitedCountries.length,
  countries: visitedCountries,
  error: error,
  users : users,
  color : currentUser.rows[0].color,
});
  

});

app.post('/user',(req,res)=>{
  if(req.body.user){
    currentUserId = req.body.user;
    res.redirect('/');
  }else{
    res.render('new.ejs');
  }
})

app.use('/new', async (req, res)=>{
  const result = await db.query('INSERT INTO users (name , color) VALUES ($1,$2) RETURNING *',[ req.body.name , req.body.color ]);
  currentUserId = result.rows[0].id;
  res.redirect('/');
})

app.post('/add', async (req, res) => {
  const countryCode = getCode(req.body.country.trim());
  
  if (countryCode) {
    try {
      await db.query('INSERT INTO visited_countries (code,user_id) VALUES ($1,$2)', [countryCode,currentUserId]);
      error = '';
      res.redirect('/');
    }
    catch (err) {
      console.error('already exist error');
      error = 'Country already exist, Enter another country';
      res.redirect('/');
    }
  } else {
    error = "country doesn't exist, Enter a different country ";
    console.error('country code error')
    res.redirect('/');
  }

});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
