let conexion = require('./conexionbd');

//-----------------------------------------------------------------
/// busca y lista todas las competencias
function buscarCompetencias(req, res) {

    let sql = "SELECT * FROM competencia;";

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }

        res.send(JSON.stringify(resultado));
    });
}

/// dentro de determinada competencia elije dos peliculas al azar dependiendo si tiene o no genero/director/actor
function buscarPeliculasRandom(req, res) {
  
    let idCompetencia = req.params.id;
    let sql = `SELECT nombre, genero_id, director_id, actor_id FROM competencia WHERE id = ${idCompetencia};`

    conexion.query(sql, function (error, resultado) {
       
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }

        let genero = resultado[0].genero_id
        let director =resultado[0].director_id
        let actor = resultado[0].actor_id


        // el DISTINCT me elije dos distintos
        let sql = 
        `   SELECT DISTINCT p.titulo, p.id, p.poster, p.genero_id FROM 
            pelicula p LEFT JOIN actor_pelicula ap ON p.id = ap.pelicula_id LEFT JOIN director_pelicula dp ON p.id = dp.pelicula_id 
            WHERE 1 = 1 
        `
        let generoSql = !genero ? " " : ` AND p.genero_id = ${genero}`
        let directorSql = !director ? " " :  ` AND dp.director_id = ${director}`
        let peliculaSql = !actor ? " " : `AND ap.actor_id = ${actor}`
        let orderLimitSql = ` ORDER BY rand() limit 2;` 
          
        let mysql = sql +  generoSql + directorSql + peliculaSql + orderLimitSql; 
        

        conexion.query(mysql, function (error, peliculas) {
            if (error) {
                console.log("Error,la competencia no existe", error.message);
                return res.status(404).send("Hubo un error en la consulta");
            }
            let response = {
                'peliculas': peliculas,
                'competencia': resultado[0].nombre
            }
            res.send(JSON.stringify(response));
        });
    });
}

/// votar
function votar(req, res) {

    let competencia = req.params.id;
    let pelicula = req.body.idPelicula;
    let sql = `INSERT INTO voto (competencia_id, pelicula_id) values (${competencia}, ${pelicula}); `
    
    // console.log('competencia, pelicula, sql', competencia, pelicula, sql);

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Error en el envio de la votacion", error.message);
            return res.status(500).send("Hubo un error en la votacion");
        }
        let response = {
            'peliculas': resultado
        }
        res.send(JSON.stringify(response));
    });

}
// muestra las peliculas mas votadas de determinada competencia
function mostrarResultados(req, res) {

    let idCompetencia = req.params.id
    let sql = `SELECT * FROM competencia WHERE id=${idCompetencia};`

    conexion.query(sql, function (error, resultado) {

        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        if (resultado.length === 0) {
            console.log("No existen preguntas votadas");
            return res.status(404).send("No se encontro ninguna pregunta votada")
        }
        let competencia = resultado[0].nombre;

        let sql =
            `   SELECT voto.pelicula_id, p.titulo, p.poster, COUNT(pelicula_id) as votos 
                FROM pelicula p JOIN voto ON p.id=voto.pelicula_id JOIN competencia c ON c.id = voto.competencia_id
                WHERE c.nombre = "${competencia}" GROUP BY voto.pelicula_id
                ORDER BY COUNT(pelicula_id) DESC LIMIT 3;
            `
            

        conexion.query(sql, function (error, resultado) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(500).send("Hubo un error en la consulta");
            }
            // console.log('competencia', competencia);
            // console.log('resultado', resultado);
            // console.log('lenght', resultado.length);

            let response = { //esto entra como DATA en cargarResultado -> por eso hay que poner competencia y resultadoS
                "competencia": competencia,
                "resultados": resultado //dos años en darme cuenta que era resultadoS, pelotudo!
            }
            res.send(JSON.stringify(response));
        });
    })
};

//crea una nueva competencia (ahora con genero-director-actor)
function crearCompetencia(req, res) {
    // console.log(req.body)
    // expresion ? true_value : false_value
    let preguntaEscrita = req.body.nombre;
    let genero  = req.body.genero === "0" ? null : req.body.genero;
    let director  = req.body.director === "0" ? null : req.body.director;
    let actor = req.body.actor === "0" ? null : req.body.actor;

    let sql = 
    `   INSERT INTO competencia (nombre, genero_id, director_id, actor_id) 
        VALUES ('${preguntaEscrita}', ${genero}, ${director}, ${actor});
    `

    // console.log(sql)

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la creacion", error.message);
            return res.status(500).send("Hubo un error en la creacion");
        }

        res.send(JSON.stringify(resultado));
    });
}

//elimina los votos de determinada competencia
function eliminarVotos(req, res) {

    let idCompetencia = req.params.id;
    let sql = `DELETE FROM voto WHERE competencia_id = ${idCompetencia}`

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en el reinicio de los votos", error.message);
            return res.status(404).send("Hubo un error en la reiniciacion");
        }

        res.send(JSON.stringify(resultado));
    });
}

//elimina la competencia y todos los votos que habia en ella de forma permanente
function eliminarCompetencia(req, res) {

    let idCompetencia = req.params.id;
    let sql = `DELETE FROM voto WHERE competencia_id = ${idCompetencia}`
    

    conexion.query(sql, function (error, resultado) {
        
        if (error) {
            console.log("Hubo un error en la eliminacion", error.message);
            return res.status(404).send("Hubo un error en la eliminacion");
        }

        let sql = `DELETE FROM competencia WHERE id = ${idCompetencia}`

        conexion.query(sql, function (error, resultado) {
            if (error) {
                console.log("Hubo un error en el reinicio de los votos", error.message);
                return res.status(404).send("Hubo un error en la reiniciacion");
            }
            res.send(JSON.stringify(resultado));
        });
    });
}

//edita el nombre de la competencia
function editarCompetencia(req, res) {

    let idCompetencia = req.params.id;
    let nuevoTitulo = req.body.nombre
    let sql = `UPDATE competencia SET nombre = '${nuevoTitulo}' WHERE id=${idCompetencia};`

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la edicion", error.message);
            return res.status(404).send("Hubo un error en la reiniciacion");
        }

        res.send(JSON.stringify(resultado));
    });
}

function cargarNombre(req, res) { 
    let nombreCompetencia = req.params.id;
    var sql = 
    //NO ENTENDÍ PORQUE PERO PROBE CON EL "LEFT" Y ANDUBO
    `   SELECT c.nombre , g.nombre genero, d.nombre director, a.nombre actor FROM 
        competencia c LEFT JOIN genero g ON genero_id = g.id LEFT JOIN director d ON director_id = d.id 
        LEFT JOIN actor a ON actor_id = a.id WHERE c.id = ${nombreCompetencia};
    `
    
    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        // console.log('response', resultado);

        //En cargarCompetencias la data tiene estos atributos (.nombre .genero_nombre .director_nombre .actor_nombre)
        var response = {
            'nombre': resultado[0].nombre,
            'genero_nombre': resultado[0].genero,
            'director_nombre': resultado[0].director,
            'actor_nombre': resultado[0].actor            
        }
        res.send(JSON.stringify(response));
    });
}
function cargarGeneros (req,res){
    
    let sql = `SELECT * FROM genero`

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la carga de los géneros", error.message);
            return res.status(404).send("Hubo un error en la carga");
        }

        res.send(JSON.stringify(resultado));
    });
}
function cargarDirectores (req,res){
    
    let sql = `SELECT * FROM director`

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la carga de los directores", error.message);
            return res.status(404).send("Hubo un error en la carga");
        }

        res.send(JSON.stringify(resultado));
    });
}
function cargarActores (req,res){
    
    let sql = `SELECT * FROM actor`

    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log("Hubo un error en la carga de los actores", error.message);
            return res.status(404).send("Hubo un error en la carga");
        }

        res.send(JSON.stringify(resultado));
    });
}

module.exports = {
    buscarCompetencias,
    buscarPeliculasRandom,
    votar,
    mostrarResultados,
    crearCompetencia,
    eliminarVotos,
    cargarNombre,
    cargarGeneros,
    cargarDirectores,
    cargarActores,
    eliminarCompetencia,
    editarCompetencia
}



//AYUDAS SQL
// "SELECT competencia_id, pelicula_id, 
// COUNT(pelicula_id) as votos FROM voto 
// GROUP BY pelicula_id ORDER BY 1 desc, 3 desc;" arma una tabla con competencia pelicula y votos

// "SELECT pelicula_id, COUNT(pelicula_id) as votos 
// FROM voto WHERE competencia_id = 3 GROUP BY pelicula_id;" dada determinada competencia muestra pelicula y votos

// "SELECT p.titulo, p.id, p.poster, COUNT(voto.pelicula_id) as votos 
// FROM pelicula p JOIN voto ON p.id=voto.pelicula_id 
// WHERE voto.competencia_id= 3 GROUP BY voto.pelicula_id;" muestra titulo id poster y votos dado determinada competencia

// "SELECT c.nombre, p.titulo, p.id, p.poster, COUNT(voto.pelicula_id) as votos 
// FROM pelicula p JOIN voto ON p.id=voto.pelicula_id JOIN competencia c ON c.id = voto.competencia_id 
// WHERE voto.competencia_id= 3 GROUP BY voto.pelicula_id;" muestra competencia titulo id poster y votos dado determinada competencia


//  let genero = resultado[0].genero_id
//  let director =resultado[0].director_id
//  let actor = resultado[0].actor_id

//  SOLO PELICULA RANDOM ----
//  SELECT titulo, id, poster FROM pelicula ORDER BY rand() limit 2;";

//  PELICULA RANDOM CONDICIONADA POR LA EXISTENCIA DE GENERO DIRECTOR Y ACTOR
/*  SELECT p.titulo, p.id, p.poster, p.genero_id FROM 
    pelicula p JOIN actor_pelicula ap ON p.id = ap.pelicula_id JOIN director_pelicula dp ON p.id = dp.pelicula_id 
    WHERE (si existe : 
        - p.genero_id = genero
        - dp.director_id = director
        - ap.pelicula_id = actor
        )
    ORDER BY rand() limit 2
*/

//  