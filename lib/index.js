const cheerio = require('cheerio');
const https = require('https');
const platforms_map = {
	"playstation-4": "72496",
	"playstation-3": "1",
	"xbox-one": "80000",
	"xbox-360": "2",
	"pc": "3",
	"ds": "4",
	"3ds": "16",
	"playstation-vita": "67365",
	"psp": "7",
	"wii": "8",
	"wii-u": "68410",
	"switch": "268409",
	"playstation-2": "6",
	"playstation": "10",
	"game-boy-advance": "11",
	"iphone-ipad": "9",
	"xbox": "12",
	"gamecube": "13",
	"nintendo-64": "14",
	"dreamcast": "15"
};

const createSearchObject = (user_query_keyword, user_query_options = null) => {
	let query_result = [];
	getSearchResults(user_query_keyword, user_query_options)
	.then((data) => {
		const $ = cheerio.load(data);
		$('div.result_wrap').each(function(index, item) {
			let d = cheerio.load(item);
		
			if (d('.main_stats p').text().split(",")[0].replace(/ /gi,'').replace(/\r?\n|\r/gi,'') == "Album"){
				
				query_result.push({
				type: d('.main_stats p').text().split(",")[0].replace(/ /gi,'').replace(/\r?\n|\r/gi,''),
				year: d('.main_stats p').text().split(",")[1].replace(/ /gi,'').replace(/\r?\n|\r/gi,''),
				title: d('.product_title a').text().split("-")[0].replace(/\n/gi,'').trim(),
				artist: d('.product_title a').text().split("-")[1].replace(/\n/gi,'').trim(),
				score: d('.metascore_w').text(),
				description: d('p.basic_stat').text(),
				uri: d('.product_title a').attr("href"),
				artworkUri: d('.result_thumbnail img').attr("src")
			});
			} else
			if (d('.main_stats p').text().split(",")[0] == "Movie"){
				query_result.push({
				type: d('.main_stats p').text().split(",")[0],
				year: d('.main_stats p').text().split(",")[1],
				title: d('.product_title a').text(),
				score: d('.metascore_w').text(),
				description: d('p.basic_stat').text(),
				uri: d('.product_title a').attr("href"),
				artworkUri: d('.result_thumbnail img').attr("src")
			});
			} else
			if (d('.main_stats p').text().split(" ")[1] == "Game"){
				query_result.push({
				type: d('.main_stats p').text().split(" ")[1],
				year: d('.main_stats p').text().split(" ")[2],
				title: d('.product_title a').text(),
				platform: d('.main_stats p').text().split(" ")[0],
				score: d('.metascore_w').text(),
				description: d('p.basic_stat').text(),
				uri: d('.product_title a').attr("href"),
				artworkUri: d('.result_thumbnail img').attr("src")
			});
			

			}
			
			//fazer os outros e olhar o game de novo pois exitem plataformas com mais nome composto
		});
		result = {items: query_result};
					if ($('ul.pages')){
				result.page = (parseInt($('.active_page .page_num').text()) -1).toString();
				result.lastPage = (parseInt($('.last_page .page_num').text()) -1).toString();
			}
			result.query = user_query_keyword;
			
			console.log(result);
		
	});
}


const getSearchResults = (user_query_keyword, user_query_options) => {
	console.log(formatPath(user_query_keyword, user_query_options));
	return new Promise(function(resolve, reject){
https.get({host:'www.metacritic.com',method: 'GET',path:formatPath(user_query_keyword, user_query_options), headers:{'user-agent':'Mozilla/5.0'}}, (resp) => {
  let data = '';
	console.log("Got response: " + resp.statusCode);
  // A chunk of data has been recieved.
  
  resp.on('data', (chunk) => {
	  data += chunk.toString();
	  
  });


resp.on('end', ()=> {
    const $ = cheerio.load(data);
	if ($('div.search_results').html()){
    resolve($('div.search_results').html());
	}
  });
});
});
	}



const formatPath = (user_query_keyword, user_query_options) => {
	let uri_path = "";
	if (!user_query_options) {
		uri_path = `/search/all/${user_query_keyword}/results`;
	} else if (user_query_options.type) {
		uri_path = `/search/${user_query_options.type}/${user_query_keyword}/results`;
	
	//if advanced search
	if (Boolean(user_query_options.category) || Boolean(user_query_options.genre) || Boolean(user_query_options.platform)) {
		uri_path += '?';
		//genre
	if (user_query_options.type 
	&& (user_query_options.type == "movie" || user_query_options.type == "album" || user_query_options.type == "game" || user_query_options.type == "tv") 
	&& user_query_options.genre) {
		
			uri_path += `genres[${user_query_options.genre}]=1`;
		
	}
	//category
		if (user_query_options.type
		&& (user_query_options.type == "person" || user_query_options.type == "company")
		&& user_query_options.category) {
			
			uri_path += `cats[${user_query_options.category}]=1`;
		
		}
		//platform
		if (user_query_options.type && user_query_options.type == "game" && user_query_options.platform) {
			
			if (uri_path.slice(-1) == '1'){
				uri_path += '&';
			}
			uri_path += `plats[${platforms_map[user_query_options.platform]}]=1`;
		}
		uri_path += `&search_type=advanced`;
	}
	//page
	if (user_query_options.page) {
		if (uri_path.slice(-1) == 's') {
			uri_path += '?';
		}
				uri_path += `&page=${user_query_options.page}`;
		}
	
	//sort
		if (user_query_options.sort) {
		if (uri_path.slice(-1) == 's') {
			uri_path += '?';
		} 
				uri_path += `&sort=${user_query_options.sort}`;
		}
	}
		return decodeURI(uri_path);
	}
	

exports.createSearchObject = createSearchObject;

