var Router=require('./Router.js').Router;
var Request=require('./Request.js').Request;
var Response=require('./Response.js').Response;

function Application()
{
	require('./Db.js').API.init();
	var router=new Router();
	var before=[];
	var server=require('http').createServer(function(req, res)
	{
		req.url+=req.url.charAt(req.url.length-1) !== '/' ? '/' : '';
		var handler=router.getHandler(req);
		if(handler === false)
		{
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end('404 - Page \''+req.url+'\' does not exists.');
			return;
		}
		var request=new Request(req);
		var response=new Response(res);
		request.setVars(handler[1]);
		req.on('data', function(data)
		{
			request.updateRawData(data);
		});
		req.on('end', function()
		{
			request.parseData();
			var repo={};
			for(var i in before)
			{
				repo[before[i]['name']]=before[i]['callback'](req, res);
			}
			handler[0]['handler'](request, response, repo);
		});
	})
	var that={
		'get': function(path, callback, options)
		{
			options=options||{};
			options.method='GET';
			router.addRoute(path, callback, options);
		},
		'post': function(path, callback, options)
		{
			options=options||{};
			options.method='POST';
			router.addRoute(path, callback, options);
		},
		'serveFiles': function(basepath, path)
		{
			console.log(basepath+'/:path');
			router.addRoute(basepath+'/:path', function(req, res, repo)
			{
				var fs=require('fs');
				var file=path+'/'+req.getVar('path').replace('..', '.');
				var ext=file.substr(file.lastIndexOf('.')+1);
				fs.readFile(file, function(err, data)
				{
					if(err)
					{
						res.writeHead(404, {'Content-Type': 'text/plain'});
						res.end('404 - Not found :( '+err.toString());
						return;
					}
					 res.writeHead(200, {'Content-Type': {
						'jpg': 'image',
						'gif': 'image',
						'png': 'image',
						'txt': 'text',
					}[ext]+'/'+ext});
					res.end(data);
				})
			}, {'path': 'all', 'method': 'GET'});
			var r=router.getRoutes();
			for(var i in r)
			{
				console.log(r[i]['route'].getRaw(), r[i]['route'].getRegexp());
			}
		},
		'listen': function(port)
		{
			server.listen(port);
		},
		'useSessions': function()
		{
			var Sessions=require('./Sessions.js').get;
			before.push({'name': 'session', 'callback': function(req, res)
			{
				return Sessions(req, res);
			}})
		}
	}
	return that;
}

exports.Application=Application;