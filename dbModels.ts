import mongoose from "mongoose"

export  interface ICourse{
    title : string,
    description : string,
    price : number,
    published : boolean
    _id : string
}
export  interface IAdmin{
    username: string,
    email : string,
    password : string,
    courses : ICourse[]
}


 export interface IUser{
    username : string,
    password : string,
    courses : string[]
} 

const adminSchema = new mongoose.Schema <IAdmin>  ({
    username : {type : String},
    email : {type : String},
    password : {type: String},
    courses : [{type : mongoose.Schema.Types.ObjectId, ref : 'course'}]
})

const courseSchema = new mongoose.Schema <ICourse> ({
    title : {type : String},
    description : {type : String},
    price : {type : Number},
    published : {type : Boolean}
}) 

const userSchema = new mongoose.Schema <IUser>({
    username : {type : String},
    password : {type : String},
    courses : [{type : mongoose.Schema.Types.ObjectId, ref : 'course'}],
}) 

export const admin =  mongoose.model('admin',adminSchema)
export const course =  mongoose.model('course',courseSchema)
export const user =  mongoose.model('user',userSchema)

