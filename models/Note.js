var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var NoteSchema = new Schema({
    _headlineId: {
        type: String,
        required: true
    },
    noteText: {
        type: String,
        required: true
    }
});

var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;