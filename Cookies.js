function Cookies(req, res)
{
	var cookies={};
	var headers=[];
	if(req.headers['cookie'])
	{
		var temp=req.headers['cookie'].split('; ');
		for(var i in temp)
		{
			cookies[temp[i].substr(0, temp[i].indexOf('='))]=temp[i].substr(temp[i].indexOf('=')+1);
		}
	}
	function get(name)
	{
		return cookies[name];
	}
	function set(name, value, path, expires, secure)
	{
		cookies[name]=value;
		path=path||'/';
		headers.push(name+'='+value+'; Path='+path);
		res.setHeader('Set-Cookie', headers);
	}
	return {
		'get': get,
		'set': set
	}
}
exports.Cookies=Cookies;