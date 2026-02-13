import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConnection from './database/dbConnection.js';
import User from './models/user.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import isLogIn from './middleware/auth.js';
import bcrypt from 'bcryptjs';
import Post from './models/post.js';
import upload from './config/multer.js';

dotenv.config();

const app = express();

await dbConnection();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});


// app.post('/userLogin', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Check if user exists
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(409).json({
//                 success: false,
//                 message: "User not exists"
//             });
//         }


//         let res = bcrypt.compare(password, user.password);

//         if (!res) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid Credential'
//             })
//         }



//         const token = jwt.sign({ email, userId: newUser._id }, process.env.SECRET);
//         res.cookie('token', token);

//         return res.status(201).json({
//             success: true,
//             message: "User Login successfully",
//             // userId: newUser._id
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// });



app.post('/userLogin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate token
        const token = jwt.sign(
            { email: user.email, userId: user._id },
            process.env.SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, { httpOnly: true });

        // return res.status(200).json({
        //     success: true,
        //     message: "User login successful"
        // });

        res.redirect('/profile');

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


app.post('/create', async (req, res) => {
    try {
        const { email, password, age, username, name } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);



        const hashPassword = await bcrypt.hash(password, salt);

        console.log(hashPassword);



        // Create new user
        const newUser = await User.create({
            name,
            username,
            email,
            password: hashPassword, // hash this with bcrypt before saving
            age
        });

        const token = jwt.sign({ email, userId: newUser._id }, process.env.SECRET, { expiresIn: '1d' });
        res.cookie('token', token);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            // userId: newUser._id
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.get('/logout', (req, res) => {
    // res.cookie('token','') older version or not correct way
    res.clearCookie('token');

    // return res.status(200).json({
    //     success: true,
    //     message: 'Logout successfully'
    // });

    res.redirect('/login');

});

app.post('/createPost', isLogIn, async (req, res) => {

    const { content } = req.body;

    let user = await User.findById(req.user.userId);

    let post = await Post.create({
        content: content,
        user: user._id,
    });

    user.posts.push(post._id);   // make sure field name is posts
    await user.save();

    res.redirect('/profile');
});


app.get('/profile', isLogIn, async (req, res) => {
    console.log(req.user);


    const user = await User.findById({ _id: req.user.userId });

    // let post = {};

    // user.password = undefined;


    // res.status(200).json({
    //     success: true,
    //     message: 'Profile open'
    // })

    await user.populate('posts')

    res.render('profile', { user });

})


app.get('/like/:id', isLogIn, async (req, res) => {
    try {
        console.log('hei')
        const postId = req.params.id;
        // console.log(req.user)
        const userId = req.user.userId;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        // Check if user already liked
        const alreadyLiked = post.likes.some(
            id => id.toString() === userId.toString()
        );

        if (alreadyLiked) {
            // Unlike
            post.likes = post.likes.filter(
                id => id.toString() !== userId.toString()
            );
        } else {
            // Like
            post.likes.push(userId);
        }

        await post.save();

        res.redirect('/profile'); // go back to profile

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

app.get('/editPost/:id', isLogIn, async (req, res) => {

    let id = req.params.id;

    let post = await Post.findById({ _id: id });

    res.render('edit', { post });

});



app.post('/edit/:id', isLogIn, async (req, res) => {
    try {
        const postId = req.params.id;
        const updatedContent = req.body.content;

        await Post.findByIdAndUpdate(postId, {
            content: updatedContent
        });

        res.redirect('/profile');

    } catch (err) {
        console.log(err);
        res.status(500).send("Error updating post");
    }
});



app.get('/file', (req, res) => {
    res.render('file');
})

app.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.file);
    res.send('Done')
})



app.listen(3000, () => {
    console.log('server running');
});
