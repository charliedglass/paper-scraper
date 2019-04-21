var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.get("/api/headlines/unsaved", function(req, res){
    db.Article.find({saved:false})
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err);
    });
});

app.put("/api/headlines/:id", function(req, res){
    db.Article.findOneAndUpdate({_id: req.params.id}, {saved: true}, {new: true})
    .then(function(dbArticle) {
    // If we were able to successfully update an Article, send it back to the client
    res.json(dbArticle);
    })
    .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
    });
});

app.get("/api/fetch", function(req, res){
    var uniqueArticles = 0;
    axios.get("https://www.nytimes.com/").then(function(response){
        var $ = cheerio.load(response.data);
        $("section[data-testid='block-TopStories'] article").each(function(i, element){
            // console.log(element);
            console.log($(this).find("li").text());
            var result = {};
            if ($(this).find("li") != undefined){
                result.url = "https://www.nytimes.com/" + $(this).find("a").attr("href");
                result.headline = $(this).find("h2").text();
                result.summary = $(this).find("li").text();
                console.log(result);
                db.Article.find({url: result.url, headline: result.headline, summary: result.summary})
                .then(function(dbArticle){
                    console.log(dbArticle);
                    if (dbArticle.length === 0){
                        uniqueArticles++;

                        db.Article.create(result)
                        .then(function(newArticle){
                            console.log(newArticle);
                        })
                        .catch(function(err){
                            console.log(err);
                        });
                    }
                })
                .catch(function(err){
                    console.log(err);
                });
            }
            
        });
        res.send("Scrape complete!");
    })

    if (uniqueArticles > 0){
        res.json({message: "There are " + uniqueArticles.toString() + " new articles."});
    }
});

app.get("/api/clear", function(req, res){
    db.Article.remove({}).then(function(error, response) {
    // Log any errors to the console
    if (error) {
        console.log(error);
    }
    else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(response);
    }
    });

    db.Note.remove({}).then(function(error, response) {
    // Log any errors to the console
    if (error) {
        console.log(error);
    }
    else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(response);
    }
    });
});

app.get("/api/headlines/saved", function(req, res){
    db.Article.find({saved:true})
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err);
    });
});

app.delete("/api/headlines/:id", function(req, res){
    db.Article.remove({_id: req.params.id}).then(function(error, response) {
    // Log any errors to the console
    if (error) {
        console.log(error);
    }
    else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(response);
    }
    });

    db.Note.remove({_headlineId: req.params.id}).then(function(error, response) {
    // Log any errors to the console
    if (error) {
        console.log(error);
    }
    else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(response);
    }
    });
});

app.get("/api/notes/:id", function(req, res){
    db.Note.find({_headlineId: req.params.id})
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err);
    });
});

app.post("/api/notes", function(req, res){
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
    .then(function(dbNote) {
    // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
    // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
    // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: {notes: dbNote._id} }, { new: true });
    })
    .then(function(dbArticle) {
    // If we were able to successfully update an Article, send it back to the client
    res.json(dbArticle);
    })
    .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
    });
});

app.delete("/api/notes/:id", function(req, res){
    // Create a new note and pass the req.body to the entry
    db.Note.remove({_id: req.params.id})
    .then(function(dbNote) {
    // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
    // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
    // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    return db.Article.findOneAndUpdate({ _id: req.params.id}, { $pull: {notes: dbNote._id} }, { new: true });
    })
    .then(function(dbArticle) {
    // If we were able to successfully update an Article, send it back to the client
    console.log(dbArticle);
    })
    .catch(function(err) {
    // If an error occurred, send it to the client
    console.log(err);
    });
})

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});
  