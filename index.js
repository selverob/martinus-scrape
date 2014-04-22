var request = require("request")
	, iconv = require("iconv-lite")
	, cheerio = require("cheerio")
	, qs = require("querystring")
	, async = require("async")
	, diacritics = require("./diacritics.js");

//Only returns URLs of the first 20 books found.
var getBookURL = function(searchTerm, cb) {
	var address = "http://martinus.sk?" + qs.stringify({
			uMod: "list",
			uTyp: "search",
			uQ: diacritics.remove(searchTerm)
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

var getPrice = function($) {
	var oldPrice = parseFloat($(".oldPrice > strong").text().replace(",", "."));
	if (!isNaN(oldPrice)) {
		return oldPrice;
	}
	var price = parseFloat($(".price > strong").text().replace(",", "."));
	return price;
}

var getAuthors = function($) {
	var authors = [];
	$(".subtitle > .author  strong").each(function(index) {
		authors[index] = this.text();
	});
	return authors;
}

var scrapeBookPage = function(bookURL, cb) {
	request.get(bookURL, {encoding: null}, function(err, res, body) {
		if (err || res.statusCode != 200) {
			cb(err, null);
			return
		}
		var utfStr = iconv.decode(body, "win1250");
		var $ = cheerio.load(utfStr);


		var book = {
			title: $("h1[itemprop=name]").text().trim(),
			authors: getAuthors($),
			publisher: $(".publisher > a").text(),
			ISBN: getISBN($),
			pubYear: getPubYear($),
			description: $("span[itemprop=description]").text().trim().replace(new RegExp("\r\n", "g"), "\n"),
			price: getPrice($),
			pages: getPages($),
			imageUrl: "http://martinus.sk" + $(".detailImageHolder > a").attr("href"),
			url: bookURL
		};
		cb(null, book);
	});
}

exports.getBook = function(searchTerm, cb) {
	getBookURL(searchTerm, function(err, urls) {
		if (err != null) {
			cb(err);
			return
		}
		async.map(urls, scrapeBookPage, cb);
	});
}

exports.normalizeISBN = function(ISBN) {
	return ISBN.replace(new RegExp("-", "g"), "");
}