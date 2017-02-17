'use strict';

function Article (opts) {
  // REVIEW: Convert property assignment to a new pattern. Now, ALL properties of `opts` will be
  // assigned as properies of the newly created article object. We'll talk more about forEach() soon!
  // We need to do this so that our Article objects, created from DB records, will have all of the DB columns as properties (i.e. article_id, author_id...)
  Object.keys(opts).forEach(function(e) {
    this[e] = opts[e]
  }, this);
}

Article.all = [];

// ++++++++++++++++++++++++++++++++++++++

// REVIEW: We will be writing documentation today for the methods in this file that handles Model layer of our application. As an example, here is documentation for Article.prototype.toHtml(). You will provide documentation for the other methods in this file in the same structure as the following example. In addition, where there are TODO comment lines inside of the method, describe what the following code is doing (down to the next TODO) and change the TODO into a DONE when finished.

/**
 * OVERVIEW of Article.prototype.toHtml():
 * - A method on each instance that converts raw article data into HTML
 * - Inputs: nothing passed in; called on an instance of Article (this)
 * - Outputs: HTML of a rendered article template
 */
Article.prototype.toHtml = function() {
  // DONE: Retrieves the  article template from the DOM and passes the template as an argument to the Handlebars compile() method, with the resulting function being stored into a variable called 'template'.
  var template = Handlebars.compile($('#article-template').text());

  // DONE: Creates a property called 'daysAgo' on an Article instance and assigns to it the number value of the days between today and the date of article publication
  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  // DONE: Creates a property called 'publishStatus' that will hold one of two possible values: if the article has been published (as indicated by the check box in the form in new.html), it will be the number of days since publication as calculated in the prior line; if the article has not been published and is still a draft, it will set the value of 'publishStatus' to the string '(draft)'
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';

  // DONE: Assigns into this.body the output of calling marked() on this.body, which converts any Markdown formatted text into HTML, and allows existing HTML to pass through unchanged
  this.body = marked(this.body);

// DONE: Output of this method: the instance of Article is passed through the template() function to convert the raw data, whether from a data file or from the input form, into the article template HTML
  return template(this);
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.loadAll();
 * - A method that grabs all of the rows from the database and pushes them into the Article array.
 * - Inputs: Takes an input of rows; Is called in Article.fetchAll
 * - Outputs: A new Article object that is then put into an array.
 */
Article.loadAll = function(rows) {
  // DONE: Grabs two published dates from the article data and compares them to see which one is newer. It will then order them to display the newest article first.
  rows.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  // DONE: Loop through each row and pushing the Article objects into an array.
  rows.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.fetchAll();
 * - This callback function is retreiving the articles table and checking if the hackerIpsum.json file has been loaded into it.  If it has, it will load the results of the table.  If it has not, then it will insert the information into the table.
 * - Inputs: Takes an argument of callback.
 * - Outputs: If the articles table exists it will call the Article.loadAll method.  If the article table does not exist it populate the table and then call itself to be run again.
 */
Article.fetchAll = function(callback) {
  // DONE: Access the database table called articles.
  $.get('/articles')
  // DONE: Use .then to chain together another function to run after .get
  .then(
    function(results) {
      if (results.length) { // If records exist in the DB
        // DONE: Run the loadAll function with the argument results
        Article.loadAll(results);
        callback();
      } else { // if NO records exist in the DB
        // DONE: Grabs the JSON file hackerIpsum and then loops through the file to create new Article objects.  It then calls the method article.insertRecord to add the Article objects to the database.
        $.getJSON('./data/hackerIpsum.json')
        .then(function(rawData) {
          rawData.forEach(function(item) {
            let article = new Article(item);
            article.insertRecord(); // Add each record to the DB
          })
        })
        // DONE: We are then recalling the callback function fetchAll with the argument of callback to rerun the first part of the if/else statement.
        .then(function() {
          Article.fetchAll(callback);
        })
        // DONE: .catch is only run if the fetchAll promise has been rejected. It will return a console error.
        .catch(function(err) {
          console.error(err);
        });
      }
    }
  )
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.truncateTable();
 * - Makes an AJAX call to delete the table articles and then console log the task has been completed
 * - Inputs: Takes an argument of callback and is not being called at this time.
 * - Outputs: The removal of the database table articles and console logs its completion
 */
Article.truncateTable = function(callback) {
  // DONE: Making an AJAX request to the database articles and providing a method of DELETE that would remove the table
  $.ajax({
    url: '/articles',
    method: 'DELETE',
  })
  // DONE: Will console log that the table deletion was successful.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.insertRecord();
 * - This method posts the article data from the table articles and console logs its completion
 * - Inputs: Takes in an argument of callback and being called in the callback function fetchAll
 * - Outputs: The article data from the table articles and console logs the results
 */
Article.prototype.insertRecord = function(callback) {
  // DONE: This block of code is grabing a row from the articles database and posting it to the website
  $.post('/articles', {author: this.author, authorUrl: this.authorUrl, body: this.body, category: this.category, publishedOn: this.publishedOn, title: this.title})
  // DONE: If the post is succesful it will console log its completion.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.deleteRecord();
 * - This method makes an AJAX to delete a selected article.
 * - Inputs: Takes in argument of callback.  This method is not being called at this time.
 * - Outputs: The output is a deletion of an article on index.html and console log of result of the function.
 */
Article.prototype.deleteRecord = function(callback) {
  // DONE: Make a AJAX request to delete the selected row on index.html
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'DELETE'
  })
  // DONE: If the previous AJAX request was succesful it will console log its completion
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.updateRecord();
 * - Makes an AJAX call to update the webpage with a new article and then console log its completion
 * - Inputs: Takes an argument of callback and is not being called at this time.
 * - Outputs: Updates the selected article data and console log the results
 */
Article.prototype.updateRecord = function(callback) {
  // DONE: Make an AJAX request from the articles database and push an updated article object to index.html
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'PUT',
    data: {  // TODO: describe what this object is doing
      author: this.author,
      authorUrl: this.authorUrl,
      body: this.body,
      category: this.category,
      publishedOn: this.publishedOn,
      title: this.title
    }
  })
  // DONE: If the AJAX request is successful it will console log that it has been completed.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};
