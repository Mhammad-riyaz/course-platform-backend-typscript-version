import express,{Express,Request,Response,NextFunction,Errback} from "express"
import mongoose,{Document,Model} from "mongoose";
import jwt,{JwtPayload} from "jsonwebtoken"
import  cors from "cors" 
import {admin,course,user,IAdmin,ICourse,IUser} from "./dbModels"

const app : Express =  express();


app.use(cors())
app.use(express.json());
  
const jwt_secret : string = "node";

const dbUrl:string = 'mongodb+srv://riyaz:q_6Df6W.R!j8BH9@cluster0.hvmk6yk.mongodb.net/';

mongoose.connect(dbUrl)

interface CustomJwtPayload extends JwtPayload{
    user?: IAdmin
}
interface CustomRequest extends Request{
    user?:CustomJwtPayload
}

interface Admin extends Document,IAdmin{
  // password?:string
}

interface Course extends Document{}

interface User extends IUser,Document{}

function verifyToken(req : CustomRequest , res : Response, next : NextFunction) {
  const token: string|undefined = req.headers.authorization;
  if (!token) return res.status(403).send("Token not provided");

  jwt.verify(token , jwt_secret, (err,decoded) => {
    if (err) return res.status(401).send("Invalid Token");
    req.user  = decoded as CustomJwtPayload;
    res.status(200)
    next();
  });
}

app.get("/admin/verify",verifyToken, (req :CustomRequest,res:Response)=>{
  if(!req.user) res.send(false)
  else res.send(true)
})

app.post("/admin/signup", async (req, res) => {
  console.log(req.headers)
  const username = req.headers.username;
  const password = req.headers.password;
  const email = req.headers.email
  console.log(username,password,email)
  const exist :IAdmin|null = await admin.findOne({ username });
  if (!exist) {
    const newAdmin : Admin = new admin({ username:username, password:password,email : email });
    await newAdmin.save();
    res
      .status(201)
      .json({
        message: "admin created successfully",
        token: jwt.sign({ username }, jwt_secret , { expiresIn: "1h" }),
      });
  } else res.status(400).send("username already exists");
});


app.post("/admin/login", async (req :CustomRequest, res : Response) => {
  const username  = req.headers.username;
  const password  = req.headers.password;
  const exist : Admin|null = await admin.findOne({ username });
  if (exist && exist.password  == password)
    res
      .status(200)
      .json({
        message: "Successfully logged In",
        token: jwt.sign({ username }, jwt_secret, { expiresIn: "1h" }),
      });
  else res.status(400).send(`admin doesn't exist`);
});


app.post("/admin/courses", verifyToken, async (req:CustomRequest, res:Response) => {
  const newCourse : Course = new course(req.body);
  const addedCourse : Course = await newCourse.save();
  if(req.user)
  await admin.findOneAndUpdate({ username : req.user.username },{ $push: { courses: addedCourse._id } },{ new: true })
  res.status(201).send('Course created successfully')
});

app.put("/admin/courses/:courseId", verifyToken, async (req : CustomRequest, res:Response) => {
  const courseId = req.params.courseId;
  if(req.user){
    const username:string|undefined = req.user.username;
  const theAdmin:Admin|null = await admin.findOne({ username }).populate("courses");
  if(theAdmin){
    const courseExist =  theAdmin.courses.find((item) => item._id == courseId);
    if (courseExist) {
      const updatedCourse = await course.findByIdAndUpdate(courseId, req.body, {
        new: true,
      });
      if(updatedCourse){
        await updatedCourse.save()
        admin.updateMany({courses :courseId},{$set : {'courses.$' : updatedCourse._id}})
        res.status(200).send("updated successfully")
      } else res.status(400).send(`course doesn't exist`);
    }
  }
  }
});

app.get("/admin/courses", verifyToken, async (req:CustomRequest, res:Response) => {
  if(req.user){
    const username = req.user.username;
    const theAdmin  = await admin.findOne({ username }).populate("courses");
    if(theAdmin)
      res.status(200).json({courses: JSON.stringify(theAdmin.courses) });
  }
});

// User routes
app.post("/users/signup", async (req : CustomRequest, res : Response) => {
  const username = req.headers.username;
  const password = req.headers.password;
  const exist : IUser|null = await user.findOne({ username });
  if (exist) return res.status(400).send("user already exists");
  const aUser : User = new user({ username, password });
  await aUser.save();
  res.status(201).json({
    message: "user created successfully",
    token: jwt.sign({ username: username }, jwt_secret, { expiresIn: "1h" }),
  });
});

app.post("/users/login", async (req : CustomRequest, res : Response) => {
  const username = req.headers.username;
  const password = req.headers.password;
  const exist : User | null = await user.findOne({ username });
  if(!exist) return res.status(400).send("user doesn't exists");
  else if(exist.password == password)
  res
    .status(200)
    .json({
      message: "Successfully logged In",
      token: jwt.sign({ username: username }, jwt_secret, { expiresIn: "1h" }),
    });
});

app.get("/users/courses", verifyToken, async (req : CustomRequest, res : Response) => {
  const courses : ICourse[] = await course.find({published : true})
  res.status(200).send({courses : courses})
});

app.post("/users/courses/:courseId", verifyToken, async (req:CustomRequest, res:Response) => {
  if(req.user){
    const username = req.user.username;
    const courseId = req.params.courseId;
    const theCourse : ICourse | null = await course.findById(courseId)
    if (!theCourse) return res.status(400).send(`Course doesn't exist`);
    await user.findOneAndUpdate({username : username},{$push : {courses : theCourse._id}})
    res.status(201).send(`${theCourse.title} purchased successfully`);
  }
});

app.get("/users/purchasedCourses", verifyToken, async (req : CustomRequest, res : Response) => {
  if(req.user){
    const username = req.user.username;
    const theUser :User | null = await user.findOne({username}).populate('courses')
    if(theUser)
    res.status(200).send({ purchasedCourses: theUser.courses });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
