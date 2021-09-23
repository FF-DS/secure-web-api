const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true,
    },
    
});



const Token = mongoose.model('Token', UserSchema);
exports.Token = Token; 