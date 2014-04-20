var request = require("request")
	, iconv = require("iconv-lite")
	, cheerio = require("cheerio")
	, qs = require("querystring")
	, async = require("async");

//Only returns URLs of the first 20 books found.
var getBookURL = function(isbn, cb) {
	var address = "http://martinus.sk?" + qs.stringify({
			uMod: "list",
			uTyp: "search",
			uQ: isbn
		});
	request.get(address, {encoding: null}, function(err, res, body) {
		if (err || res.statusCode != 200) {
			cb(err, null);
			return
		}
		var utfStr = iconv.decode(body, "win1250");
		var $ = cheerio.load(utfStr);
		var links = $("a", $(".title"));
		var urls = [];
		links.each(function(i, elem) {
			urls[i] = $(this).attr("href");
		});
		if (!urls) {
			cb(new Error("Book not found"), null);
			return
		}
		cb(null, urls)
	});
}

var getISBN = function($) {
	var isbn = ""
	var specs = $("ul.square > li");
	specs.each(function(i, elem) {
		var match = /ISBN: (.*)/.exec(this.text());
		if (match) {
			isbn = match[1];
		}
	});
	return isbn;
}

var getPages = function($) {
	var pages = 0;
	var pagesMatch = /(\d*) strán/.exec($(".specification").text())
	if (pagesMatch) {
		pages = parseInt(pagesMatch[1]);
	}
	return pages;
}

var getPubYear = function($) {
	var pubYear = 0;
	var pubYearMatch = /\d\d\d\d/.exec($(".subtitle"))
	if (pubYearMatch) {
		pubYear = parseInt(pubYearMatch[0]);
	}
	return pubYear;
}

var scrapeBookPages = function(bookURLs, cb) {
	var scrapePage = function(bookURL, cb) {
		request.get(bookURL, {encoding: null}, function(err, res, body) {
			if (err || res.statusCode != 200) {
				cb(err, null);
				return
			}
			var utfStr = iconv.decode(body, "win1250");
			var $ = cheerio.load(utfStr);


			var book = {
				title: $("h1[itemprop=name]").text().trim(),
				author: $(".subtitle > .author  strong").text(),
				publisher: $(".publisher > a").text(),
				ISBN: getISBN($),
				pubYear: getPubYear($),
				price: parseFloat($(".oldPrice > strong").text().replace(",", ".")),
				pages: getPages($),
				imageUrl: "http://martinus.sk" + $(".detailImageHolder > a").attr("href")
			}
			cb(null, book);
		});
	}
	async.map(bookURLs, scrapePage, cb);
}


exports.getBook = function(searchTerm, cb) {
	getBookURL(searchTerm, function(err, urls) {
		if (err != null) {
			cb(err);
			return
		}
		scrapeBookPages(urls, function(err, books) {
			if (err != null) {
				cb(err);
				return
			}
			cb(null, books);
		})
	});
}

exports.normalizeISBN = function(ISBN) {
	return isbn.replace(new RegExp("-", "g"), "");
}