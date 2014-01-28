#Martinus-scrape
Martinus-scrape is a package that lets you download book data by ISBN from [Martinus.sk](http://martinus.sk) online bookshop.

##Usage
```JavaScript
var m = require("martinus-scrape")
m.getBook("978-0-330-50853-7", function(err, book) { //The dashes are optional
	if(!err) {
		console.log(book)
	}
});
```
prints
```JavaScript
{ title: 'The Hitchhiker\'s Guide to the Galaxy',
author: 'Douglas Adams',
publisher: 'Pan Books',
pubYear: '2009',
price: 11.8,
pages: 180,
ISBN: '9780330508537' }
```