function Response(raw)
{
	var responseCode=200;
	var headers={'Content-Type': 'text/html'};
	var response=raw;
	response.redirect=function(url, code)
	{
		code=code||302;
		raw.writeHead(code,{'Location': url});
		raw.end();
	};
	response.setResponseCode=function(code)
	{
		responseCode=code;
	}
	response.setHeader=function(name, value)
	{
		headers[name]=value;
	}
	response.sendHead=function()
	{
		raw.writeHead(responseCode, headers);
	}
	response.setContentType=function(type)
	{
		var types={
			'plain': 'text/plain',
			'html': 'text/html',
		};
		headers['Content-Type']=types[type] === undefined ? type : types[type];
	}
	return response;
}

exports.Response=Response;