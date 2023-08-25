const express = require('express');
const cors = require('cors');
const mongoose  = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const BASE_URL = process.env.BASE_URL;
const app = express();
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({dest : 'uploads/'});
const secret =  'qwertyuiopasdfghjkl';
const fs = require('fs');

const corsOptions = {
  credentials: true,
   // Allow requests from this origin
};
app.use((req, res, next) => {
  res.header({"Access-Control-Allow-Origin": "*"});
  next();
}) 
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));


mongoose.connect('mongodb+srv://saurabh:147852@cluster0.wy8es8z.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



 app.post ('/register',async (req,res)=> {
const {username,email,password} = req.body;
try{
const userDoc =  await User.create({username, email, password:bcrypt.hashSync(password,10),});
    res.json(userDoc);
}

catch(e){
    console.log(e);
    res.status(400).json(e);
}
 });


 app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});






//  app.post('/login', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//       const userDoc = await User.findOne({ username });
//       if (!userDoc) {
//         return res.status(401).json({ error: 'User not found' });
//       }
//       const passok = bcrypt.compareSync(password, userDoc.password);
//       if (passok) {
//         const token = jwt.sign({ id: userDoc._id }, secret, { expiresIn: '1h' }); // Set token expiration time
//         res.cookie('token', token, { httpOnly: true, secure: true }).json({id:userDoc._id,username,}); // Secure and httpOnly cookie
//         res.json({ token });
//       } else {
//         res.status(401).json({ error: 'Incorrect password' });
//       }
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ error: 'Login failed' });
//     }
//   });



  // app.get('/profile', (req,res) => {
  //   const {token} = req.cookies;
  //   jwt.verify(token, secret, {}, (err,info) => {
  //     if (err) throw err;
  //     res.json(info);
  //   });
  // });




  app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
      if (err) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.json(info);
      }
    });
  });
  



app.post('/logout', (req, res) => {
    res.clearCookie('token').json('ok');
  });







// app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
//   const { originalname, path } = req.file;
//   const parts = originalname.split('.');
//   const ext = parts[parts.length - 1];
//   const newPath = path + '.' + ext;
//   fs.renameSync(path, newPath);

//   try {
//     const { title, summary, content, authorUsername } = req.body;

//     // Retrieve the author's username from the user database using the provided authorUsername
//     const authorDoc = await User.findOne({ username: authorUsername });

//     if (!authorDoc) {
//         return res.status(404).json({ error: 'Author not found' });
//     }

//     // Create the post with the associated author's username
//     const postDoc = await Post.create({
//         title,
//         summary,
//         content,
//         cover: newPath,
//         author: {
//             id: authorDoc._id,         // You can also store the author's ID if needed
//             username: authorUsername  // Associate the author's username with the post
//         }
//     });

//     res.json(postDoc);
// } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error creating post' });
// }
// });








  app.post('/post',uploadMiddleware.single('file'),async(req,res) =>{
const {originalname,path} =req.file;
const parts = originalname.split('.');
const ext = parts[parts.length -1];
const newpath = path +'.'+ext;
fs.renameSync(path,newpath);

const {token} = req.cookies;
jwt.verify(token, secret, {}, async (err,info) => {
  if (err) throw err;

const {title,summary,content} = req.body;
const postDoc = await Post.create({
  title,
  summary,
  content,
  cover : newpath,
  author: info.id,

});
res.json(postDoc);
});
  });



  app.put('/post',uploadMiddleware.single('file'), async (req,res) => {
    let newPath = null;
    if (req.file) {
      const {originalname,path} = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path+'.'+ext;
      fs.renameSync(path, newPath);
    }
  
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {id,title,summary,content} = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json('you are not the author');
      }
      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });
  
      res.json(postDoc);
    });
  
  });















  app.get('/post', async (req,res) => {
    res.json(
      await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)
    );
  });


  app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
  })


// app.get('/post',async (req,res) =>{
// res.json(await Post.find().populate('author',['username'])
// );
// })





//  app.post('/login', async (req,res) => {
//     const{username,password} = req.body;
//     const userDoc = await User.findOne({username});
//     const passok = bcrypt.compareSync(password,userDoc.password);
//     if(passok){
//   jwt.sign({username,id:userDoc._id},secret,{},(err,token)=>{
//  if(err) throw err;
//  res.cookie('token',token).json('ok');
//  res.json(token)
//   })
//     }
//     else{
//         res.status(400).json('Password is wrong');
//     }
//  })


 app.listen(4000 || process.env.PORT);
