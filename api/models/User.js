const mongoose = require('mongoose');
const{model} = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema ({
    username : {type: String ,required : true, min:4, unique:true},
    email : {type: String ,required : true, min:4, unique:true},
    password : {type: String , require:true},
    
});

const UserModel = model('User',UserSchema);


module.exports = UserModel;