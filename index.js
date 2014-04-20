var request = require("request")
	, iconv = require("iconv-lite")
	, cheerio = require("cheerio")
	, qs = require("querystring")
	, async = require("async");

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
				pubYear: /\d\d\d\d/.exec($(".subtitle"))[0],
				price: parseFloat($(".oldPrice > strong").text().replace(",", ".")),
				pages: parseInt(/(\d*) strán/.exec($(".specification").text())[1]),
				imageUrl: "http://martinus.sk" + $(".detailImageHolder > a").attr("href")
			}
			cb(null, book);
		});
	}
	async.map(bookURLs, scrapePage, cb);
}


exports.getBook = function(isbn, cb) {
	getBookURL(isbn.replace(new RegExp("-", "g"), ""), function(err, urls) {
		if (err != null) {
			cb(err);
			return
		}
		scrapeBookPages(urls, function(err, books) {
			if (err != null) {
				cb(err);
				return
			}
			books.forEach(function (book) {
				book.ISBN = isbn;
			});
			cb(null, books);
		})
	});
}