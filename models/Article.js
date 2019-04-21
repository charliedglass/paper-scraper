var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    url: {
        type: String,
        required: true
    },

    headline: {
        type: String,
        required: true
    },

    summary: {
        type: String,
        required: true
    },

    saved: {
        type: Boolean,
        default: false,
        required: true
    },

    notes: [
        {
            type: Schema.Types.ObjectId,
            ref: "Note"
        }
    ]
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;