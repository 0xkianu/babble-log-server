const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const Sequelize = require('sequelize');
const { Log, User, Folder } = require('./models');
const { Op } = require('sequelize');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 2592000000,
     } 
  })
);

//test for accessibility
app.get('/heartbeat', (req, res) => {
    res.json({
        "is": "working"
    })
});

app.get('/check-auth', async(req, res) => {
  if(req.session.user) {
    res.send({
      isLoggedIn: !(req.session.user == null),
      username: req.session.user,
      });
  } else {
    res.send({
      isLoggedIn: !(req.session.user == null),
      username: 'unassigned',
      });
  }
});

app.post('/login', async(req, res) => {
  const user = await User.findAll({
    where: {
      username: {
        [Op.eq]: req.body.username
      }
    }
  });
  if(user[0] == null) {
    res.json({success: false, message: 'Username or password invalid'});
  } else {
    bcrypt.compare(req.body.passphrase, user[0].password, function(err, result) {
      if ((result) && (req.body.username === user[0].username)) {
        req.session.user = req.body.username;
        res.json({success: true, message: 'Login success'});
      } else {
        res.json({success: false, message: 'Username or password invalid'});
      }
    });
  }
});

app.post('/create_account', async(req, res) => {
  const user = await User.findAll({
    where: {
      username: {
        [Op.eq]: req.body.username
      }
    }
  });
  if(user[0] == null) {
    bcrypt.hash(req.body.passphrase, 10, function(err, hash) {
        User.create({username: req.body.username, password: hash});
        Folder.create({name: 'notes', user: req.body.username})
    });
    res.json({success: true, message: 'Create success'});
  } else {
    res.json({success: false, message: 'Username or password invalid'});
  }
});

app.get('/logout', async(req, res) => {
  req.session.destroy();
  res.send({
    isLoggedIn: false,
    });
});

/* Main app routes */
app.get('/babble/home', async(req, res) => {
    const babbleLog = await Log.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send({
      babbleLog: babbleLog,
      isLoggedIn: !(req.session.user == null),
      });
 });

app.delete('/babble/home', async(req, res) => {
    await Log.destroy({
        where: {
          id: req.body.babbleID
        }
      });
    const babbleLog = await Log.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send({
      babbleLog: babbleLog,
      isLoggedIn: !(req.session.user == null),
      });
});

app.post('/babble/new', async(req, res) => {
  const babble = await Log.create({babble: req.body.babble, folder: req.body.folder, user: req.session.user});
  res.send({
    babble: babble,
    isLoggedIn: !(req.session.user == null),
    });
});

app.get('/babble/folders', async(req, res) => {
    const folders = await Folder.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','ASC']]});
    res.send({
      folders: folders,
      isLoggedIn: !(req.session.user == null),
      });
 });

 app.post('/babble/folders', async(req, res) => {
    await Folder.create({name: req.body.folderName, user: req.session.user})
    .then(folder => {res.send({
      folder: folder,
      isLoggedIn: !(req.session.user == null),
      });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the folder."
          });
    })
  })

  app.delete('/babble/folders', async(req, res) => {
        await Folder.destroy({
            where: {
              id: req.body.folderID
            }
          });
        const folders = await Folder.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
        const babbles = await Log.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
        res.send({
          folders: folders,
          babbles: babbles,
          isLoggedIn: !(req.session.user == null),
          });
  });

  app.post('/babble/update-folder', async(req, res) => {
    await Log.update({ folder: req.body.folder }, {
      where: {
        id: req.body.babbleID
      }
    });
    const babbles = await Log.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send({
      babbles: babbles,
      isLoggedIn: !(req.session.user == null),
      });
  })

const server = app.listen(3001, function() {
    console.log('listening on port 3001');
});