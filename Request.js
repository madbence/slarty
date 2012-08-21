var url=require('url');
var qstring=require('querystring');

function Request(raw)
{
	var reqURL=url.parse(raw.url, true);
	var getData=reqURL.query;
	var postData={};
	var urlVars={};
	var rawData='';
	var obj={
		'getRaw': function(){return raw;},
		'updateRawData': function(newData){rawData+=newData.toString()},
		'parseData':function(){postData=qstring.parse(rawData);},
		'getVar': function(name){return urlVars[name];},
		'setVar': function(name, value){urlVars[name]=value;},
		'setVars': function(values){urlVars=values;},
		'getRawData': function(){return rawData;},
		'getParam': function(name)
		{
			if(getData[name] !== undefined)
			{
				return getData[name];
			}
			if(postData[name] !== undefined)
			{
				return postData[name];
			}
			throw new Error('Parameter \''+name+'\' does not exists.');
		}
	}
	return obj;
}

exports.Request=Request;