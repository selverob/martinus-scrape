#Martinus-scrape 

Martinus-scrape is a package that lets you download book data from
[Martinus.sk](http://martinus.sk) online bookshop.

You can call `getBook` with any search term you want, but if you want to
search for ISBNs, use `normalizeISBN`, because the search engine  only accepts
ISBNs without dashes.

##Usage
```JavaScript
var m = require("martinus-scrape")
m.getBook(m.normalizeISBN("80-7145-606-3"), function(err, book) {
	if(!err) {
		console.log(book)
	}
});
```
prints
```JavaScript
[ { title: 'Pán Prsteňov - kolekcia I. II. III.',
    author: 'J.R.R. Tolkien',
    publisher: 'Slovart',
    ISBN: '8071456063',
    pubYear: 2002,
    description: *The description of the book*,
    price: 44.85,
    pages: 1243,
    imageUrl: 'http://martinus.sk/data/tovar/_l/11/l11304.jpg',
    url: 'http://www.martinus.sk/?uItem=11304' },
  { title: 'Pán Prsteňov I. - Spoločenstvo Prsteňa',
    author: 'J.R.R. Tolkien',
    publisher: 'Slovart',
    ISBN: '8071456063',
    pubYear: 2001,
    description: *The description of the book*,
    price: 14.95,
    pages: 454,
    imageUrl: 'http://martinus.sk/data/tovar/_l/9/l9687.jpg',
    url: 'http://www.martinus.sk/?uItem=9687' } ]

```

##Limitations
Martinus-scrape only downloads the first 20 search results (the first page).
Its intended use is in collection management software, where you know pretty
well what you're searching for, so I don't think any more are needed. Anyway,
since Martinus.sk has no public API and this is just an HTML scraper, I'm not
sure any other use would even be legal.
