//paquetes necesarios para el proyecto
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors')
var { 
  cargarGeneros, cargarDirectores, cargarActores, buscarPeliculasRandom, votar, mostrarResultados, cargarNombre, buscarCompetencias, crearCompetencia, eliminarCompetencia, eliminarVotos, editarCompetencia 
} = require('./competenciasController');

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


///////////////////////////////////////////
app.get('/generos', cargarGeneros);
app.get('/directores', cargarDirectores);
app.get('/actores', cargarActores);

app.get('/competencias/:id/peliculas', buscarPeliculasRandom)
app.post('/competencias/:id/voto', votar)
app.get('/competencias/:id/resultados', mostrarResultados)
app.get('/competencias/:id', cargarNombre);
app.get('/competencias', buscarCompetencias)

app.post('/competencias', crearCompetencia)
app.put('/competencias/:id', editarCompetencia)

app.delete('/competencias/:id/votos', eliminarVotos)
app.delete('/competencias/:id', eliminarCompetencia)




//seteamos el puerto en el cual va a escuchar los pedidos la aplicación
var puerto = '8080';

app.listen(puerto, function () {
  console.log( "Escuchando en el puerto " + puerto );
});











