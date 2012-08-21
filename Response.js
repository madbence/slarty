function Response(raw)
{
	raw.redirect=function(url, code)
	{
		code=code||302;
		raw.writeHead(code,{'Location': url});
		raw.end();
	}
	return raw;
}

exports.Response=Response;