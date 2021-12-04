const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const port = 3333;
const db = require('mysql');


const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const chave = 'a4e1112f45e84f785358bb86ba750f48'
const iv = crypto.randomBytes(16);



const con = db.createConnection({
     host: 'localhost', // O host do banco. Ex: localhost
     user: 'root', // Um usuário do banco. Ex: user 
     password: '1234', // A senha do usuário. Ex: user123
     database: 'cript' // A base de dados a qual a aplicação irá se conectar
});


function encrypt(text) {
     let cipher =
          crypto.createCipheriv('aes-256-cbc', Buffer.from(chave), iv);
     let encrypted = cipher.update(text);
     encrypted = Buffer.concat([encrypted, cipher.final()]);
     return {
          iv: iv.toString('hex'),
          encryptedData: encrypted.toString('hex')
     };
}

function decrypt(text) {
     let iv = Buffer.from(text.iv, 'hex');
     let encryptedText =
          Buffer.from(text.encryptedData, 'hex');
     let decipher = crypto.createDecipheriv(
          'aes-256-cbc', Buffer.from(chave), iv);
     decipher.setAutoPadding(true);
     let decrypted = decipher.update(encryptedText);
     decrypted = Buffer.concat([decrypted, decipher.final()]);
     return decrypted.toString();
}


app.use(cors())
app.use(bodyParser.json());

app.post('/cadastro', (req, res) => {
     const name = req.body.name
     var output = encrypt(name)
     var pegaIdBanco;
     con.query('SELECT MAX(idtest) FROM dados', (err, result) => {
          if (err) throw err;
          console.log(Object.values(JSON.parse(JSON.stringify(result[0])))[0] == null)
          pegaIdBanco = Object.values(JSON.parse(JSON.stringify(result[0])))[0]
     })


     var insert = "INSERT INTO dados (iv, encryptedData) VALUES (?)";
     var values = [[output.iv, output.encryptedData]]
     con.query(insert, values, (err, result) => {
          if (err) throw err;
          res.send({ id: ++pegaIdBanco, encripted_name: name })
     });

})



app.post('/id', (req, res) => {
     const id = req.body.id
     con.query("SELECT iv,encryptedData FROM dados WHERE idtest = ?", id, (err, result) => {
          console.log(result.iv == null)
          if (result.iv == null) { res.send({ erro: 'Usuario inesistente' }).end() }
          if (err) res.send({ erro: err }).end();

          res.send({ id: id, msgEncripted: decrypt({ iv: result[0].iv, encryptedData: result[0].encryptedData }) })
     })
})

app.listen(port, () => { console.log(`servidor rodando na porta ${port}`) })