var crypto=require('crypto');
var db=require('./Db.js').API;
function auth(username, password, fn)
{
	db.getOne('users', {'name': username}, {'fields':{'salt':1}}, function(err, data)
	{
		if(err)
		{
			return fn(err, null);
		}
		else if(data === null)
		{
			return fn({'message': 'User not found!'}, null);
		}
		var hash=crypto.createHash('sha1').update(':::'+username+':::'+password+':::'+data['salt']+':::').digest('hex');
		db.getOne('users', {'name': username, 'password': hash}, function(err, data)
		{
			if(err)
			{
				return fn(err, null);
			}
			else if(data === null)
			{
				return fn({'message': 'Wrong password!'}, null);
			}
			fn(err, data);
		})
	})
}
function register(username, password, fn)
{
	db.count('users', {'name': username}, function(err, count)
	{
		if(err)
		{
			return fn(err, null);
		}
		else if(count > 0)
		{
			return fn({'message': 'Username is taken!', 'original': err}, null);
		}
		var salt=crypto.createHash('sha1').update(Math.random().toString()).digest('hex');
		var hash=crypto.createHash('sha1').update(':::'+username+':::'+password+':::'+salt+':::').digest('hex');
		db.findOne('users', null, {'sort':[['_id',-1]]}, function(err, item)
		{
			if(err)
			{
				return fn(err, null);
			}
			db.insert('users', {
				'_id': item['_id'],
				'name': username,
				'password': hash,
				'salt': salt,
				'registered': new Date().getTime(),
				'active': true,
				'admin': false
			}, function(err, result)
			{
				if(err)
				{
					return fn({'message': 'Database error', 'original': err}, null);
				}
				fn(err, result);
			})
		});
	})
}

exports.register=register;
exports.auth=auth;