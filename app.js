//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://brianp:bpalacios1@cluster0.wfldubj.mongodb.net/todolistDB");

const itemsSchema = {
  name: {
    type: String,
    required: [true, "Please enter a name."]
  }
};


const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to your procrastination list!"
});

const item2 = new Item({
  name: "Press the + button to add an item."
});

const item3 = new Item({
  name: "<-- Press this if you want less things to procrastinate about."
});


const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);




app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === 'Today'){

    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  };



});

app.post("/delete", function(req, res) {
  const checkboxID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === 'Today'){
    Item.findByIdAndRemove(checkboxID, function(err) {
      if (!err) {
        console.log("successfully deleted");
      }
      res.redirect("/");
    });

  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkboxID}}}, function(err, foundList){
        if (!err){
          res.redirect('/' + listName);
        };
    });
  };
});

// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/:nameOfList", function(req, res) {
  // gets the name we put in url localhost..../nameOfList
  const nameOfList = _.capitalize(req.params.nameOfList);
  // Looking to see if List is already created
  List.findOne({name: nameOfList}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list.
        const list = new List({
          name: nameOfList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + nameOfList);
      }else {
        //Show existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      };
    };
  });

});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port ==  null || port == "") {
  port = 3000;
};

app.listen(port, function() {
  console.log("Server started successfully");
});
