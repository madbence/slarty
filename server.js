var lib=require('./Application.js');

var app=new lib.Application();
var blog=require('./Blog.js').Blog;
var template=require('./Template.js');
var http=require('http');

app.useSessions();

app.get('/viewSession', function(req, res, repo)
{
	res.end(JSON.stringify(repo['session'].getAll(), null, 4));
});
app.get('/listActiveSessions', function(req, res, repo)
{
	var s=require('./Sessions.js').getAll();
	var s2={}
	for(var i in s)
	{
		s2[i]=s[i].getAll();
	}
	res.end(JSON.stringify(s2, null, 4));
});
app.get('/register', function(req, res, repo)
{
	if(repo['session'].get('isLoggedin'))
	{
		return res.redirect('/');
	}
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('<form method="post"><input name="username" /><input type="password" name="password" /><input type="submit" /></form>');
})
app.post('/register', function(req, res, repo)
{
	if(repo['session'].get('isLoggedin'))
	{
		return res.redirect('/');
	}
	var u=req.getParam('username');
	var p=req.getParam('password');
	var users=require('./Users.js');
	users.register(u, p, function(err, result)
	{
		if(err)
		{
			return res.end(JSON.stringify(err, null, 4));
		}
		users.auth(u,p,function(err, result)
		{
			if(err)
			{
				return res.end(JSON.stringify(err, null, 4));
			}
			repo['session'].set('isLoggedin', true);
			repo['session'].set('user', result);
			res.redirect('/viewSession', 302);
		})
	})
})
app.post('/login', function(req, res, repo)
{
	if(repo['session'].get('isLoggedin'))
	{
		return res.redirect('/');
	}
	var u=req.getParam('username');
	var p=req.getParam('password');
	var users=require('./Users.js');
	users.auth(u, p, function(err, result)
	{
		if(err)
		{
			return res.end(JSON.stringify(err, null, 4));
		}
		repo['session'].set('isLoggedin', true);
		repo['session'].set('user', result);
		res.redirect('/');
	});
});
app.get('/logout', function(req, res, repo)
{
	repo['session'].destroy();
	res.redirect('/');
})
app.get('/addBacon', function(req, res, repo)
{
	http.get({
		'host': 'baconipsum.com',
		'port': 80,
		'path': '/api/?type=all-meat&paras=5&start-with-lorem=1'
	}, function(ress)
	{
		var data='';
		ress.on('data', function(d)
		{
			data+=d.toString();
		});
		ress.on('end', function()
		{
			data=JSON.parse(data);
			blog.addPost('Some random bacon stuff', '<p>'+data.join('</p><p>')+'</p>' , ['text','photo','video','quote','chat','audio','link'][Math.floor(Math.random()*7)], function()
			{
				res.end('Success...');
			});
		});
		ress.on('error', function(){console.log(arguments);res.end(':(')})
	})
});
app.get('/addPost', function(req, res, repo)
{
	if(!repo['session'].get('isLoggedin'))
	{
		return res.redirect('/');
	}
	var start=process.hrtime();
	var session=repo['session'];
	res.writeHead(200, {'Content-Type': 'text/html; charset=utf8'});
	blog.getPosts(1, function(err, data)
	{
		var t=template.get('layout.html');
		res.end(template.get('layout.html').render(
		{
			'content': template.get('postForm.html').render(),
			'loginForm': function()
			{
				if(session.get('isLoggedin'))
				{
					return '<div id="loginForm"><a id="loginButton" href="/logout">Logout!</a></div>';
				}
				return template.get('loginForm.html').render();
			}(),
			'userName': session.get('user')!==undefined?session.get('user')['name']:'Anonymous',
			'renderInfo': template.get('renderinfo.html').render({
				'time': (process.hrtime(start)[1]/1000000).toFixed(3),
				'uptime': Math.round(process.uptime()),
				'heapUsed': (process.memoryUsage()['heapUsed']/1024/1024).toFixed(2),
				'heapTotal': (process.memoryUsage()['heapTotal']/1024/1024).toFixed(2),
				'version': process.version,
				'platform': process.platform,
				'arch': process.arch
			})
		}));
	})
});
app.post('/addPost', function(req, res, repo)
{
	if(!repo['session'].get('isLoggedin'))
	{
		return res.redirect('/');
	}
	blog.addPost(req.getParam('title'), req.getParam('content'), 'text', function(err, result)
	{
		if(err)
		{
			return res.end(JSON.stringify(err, null, 4));
		}
		res.redirect('/');
	})
});
app.get('/', function(req, res, repo)
{
	var start=process.hrtime();
	var session=repo['session'];
	res.writeHead(200, {'Content-Type': 'text/html; charset=utf8'});
	blog.getPosts(1, function(err, data)
	{
		blog.getPaginationData(1, function(pagination)
		{
			res.end(template.get('layout.html').render(
			{
				'content': template.get('posts.html').render({
					'posts': template.get('post.html').render(data),
					'pagination': template.get('pagination.html').render({
						'next': pagination['hasNext'] ? '<a href="/page/'+pagination['next']+'">Next page</a>' : '',
						'prev': pagination['hasPrev'] ? '<a href="/page/'+pagination['prev']+'">Prevorious page</a>' : '',
						'current': 'Page '+pagination['current']+'/'+pagination['all']
					})
				}),
				'loginForm': function()
				{
					if(session.get('isLoggedin'))
					{
						return '<div id="loginForm"><a id="loginButton" href="/logout">Logout!</a></div>';
					}
					return template.get('loginForm.html').render();
				}(),
				'userName': session.get('user')!==undefined?session.get('user')['name']:'Anonymous',
				'renderInfo': template.get('renderinfo.html').render({
					'time': (process.hrtime(start)[1]/1000000).toFixed(3),
					'uptime': Math.round(process.uptime()),
					'sysuptime': Math.round(require('os').uptime()),
					'heapUsed': (process.memoryUsage()['heapUsed']/1024/1024).toFixed(2),
					'heapTotal': (process.memoryUsage()['heapTotal']/1024/1024).toFixed(2),
					'version': process.version,
					'platform': process.platform,
					'arch': process.arch
				})
			}));
		});
	});
});

app.listen(8080);