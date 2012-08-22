var lib=require('./Application.js');

var app=new lib.Application();
var blog=require('./Blog.js').Blog;
var template=require('./Template.js');
var http=require('http');
var Jobs=require('./Jobs.js');

app.useSessions();

app.get('/viewSession', function(req, res, repo)
{
	var fn=renderLayout(req, res, repo)
	fn('<pre>'+JSON.stringify(repo['session'].getAll(), null, 4)+'\r\nLast access: '+repo['session'].getLastAccess()+'</pre>');
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
		'path': '/api/?type=all-meat&paras='+(Math.ceil(Math.random()*5))+'&start-with-lorem=1'
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
	var fn=renderLayout(req, res, repo)
	blog.getPosts(1, function(err, data)
	{
		fn(template.get('postForm.html'));
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
	renderPage(1, req, res, repo);
});
app.get('/page/:page', function(req, res, repo)
{
	renderPage(parseInt(req.getVar('page')), req, res, repo);
});
app.get('/post/:id', function(req, res, repo)
{
	var id=parseInt(req.getVar('id'));
	var fn=renderLayout(req, res, repo);
	blog.getPost(id, function(err, data)
	{
		fn(template.get('post.html').addVariables(data));
	});
});
app.serveFiles('/media', './files/media');

app.listen(8080);

function renderPage(page, req, res, repo)
{
	var fn=renderLayout(req, res, repo);
	Jobs.paralell({
		'posts': function(job)
		{
			blog.getPosts(page, function(err, data)
			{
				job.finish({
					'error': err,
					'data': data});
			});
		},
		'pagination': function(job)
		{
			blog.getPaginationData(page, function(pagination)
			{
				job.finish(pagination);
			});
		}
	}, function(results)
	{
		var pagination=results['pagination'];
		fn(template.get('posts.html').addVariables({
				'posts': template.get('post.html').setVariableArray(results['posts']['data']),
				'pagination': template.get('pagination.html').addVariables({
					'next': pagination['hasNext'] ? '<a href="/page/'+pagination['next']+'">Next page</a>' : '',
					'prev': pagination['hasPrev'] ? '<a href="/page/'+pagination['prev']+'">Prevorious page</a>' : '',
					'current': 'Page '+pagination['current']+'/'+pagination['all']
				})
			})
		);
	})
}

function renderLayout(req, res, repo)
{
	repo['util.start']=process.hrtime();
	res.writeHead(200, {'Content-Type': 'text/html; charset=utf8'});
	return function(content)
	{
		res.end(template.get('layout.html').addVariables({
			'loginForm': template.get('loginForm.html'),
			'userName': repo['session'].get('user')!==undefined?repo['session'].get('user')['name']:'Anonymous',
			'isLoggedin': repo['session'].get('isLoggedin'),
			'isAdmin': repo['session'].get('user')!==undefined?repo['session'].get('user')['admin']:false,
			'renderInfo': template.get('renderinfo.html').addVariables({
				'time': (process.hrtime(repo['util.start'])[1]/1000000).toFixed(3),
				'uptime': Math.round(process.uptime()),
				'sysuptime': Math.round(require('os').uptime()),
				'heapUsed': (process.memoryUsage()['heapUsed']/1024/1024).toFixed(2),
				'heapTotal': (process.memoryUsage()['heapTotal']/1024/1024).toFixed(2),
				'version': process.version,
				'platform': process.platform,
				'arch': process.arch
			})
		}).addVariable('content', content).render());
	}
}