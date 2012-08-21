var db=require('./Db.js').API;

var blog={
	'getPost': function(id, fn)
	{
		db.getOne('posts', {'_id': id}, function(err,item)
		{
			if(err)
			{
				return fn(err, item);
			}
			if(item === null)
			{
				return fn({'message': 'Post not found!'},null);
			}
		})
	},
	'getPosts': function(page, fn)
	{
		var limit=10;
		var start=(page-1)*limit;
		db.get('posts', null, {
				'sort': [['date', -1]],
				'limit': limit,
				'skip': start}, function(err, data)
		{
			if(err)
			{
				return fn(err, data);
			}
			fn(err, data);
		});
	},
	'addPost': function(title, content, type, fn)
	{
		db.getOne('posts',null,{'sort':[['_id',-1]]}, function(err, data)
		{
			db.insert('posts',{
				'_id': data === null ? 1 : data['_id']+1,
				'title': title,
				'content': content,
				'date': new Date().getTime(),
				'type': type}, fn);
		});
	},
	'getPaginationData': function(page, fn)
	{
		var limit=10;
		db.count('posts', null, function(err, count)
		{
			var pages=Math.ceil(count/limit);
			fn({
				'hasNext': pages>page,
				'hasLast': pages-1>page,
				'hasPrev': page>1,
				'hasFirst': page>2,
				'current': page,
				'next': page+1,
				'prev': page-1,
				'all': pages
			});
		})
	}
}

exports.Blog=blog;