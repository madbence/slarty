var Router=require('./Router.js').Router;
var Request=require('./Request.js').Request;
var Response=require('./Response.js').Response;

function Application()
{
	require('./Db.js').API.init();
	var router=new Router();
	var before=[];
	var handle={
		'GET': function(req, res, fn)
		{
			fn(req, res);
		},
		'POST': function(req, res, fn)
		{
			req.getRaw().on('data', function(data)
			{
				req.updateRawData(data);
			});
			req.getRaw().on('end', function()
			{
				fn(req, res);
			});
		}
	}
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