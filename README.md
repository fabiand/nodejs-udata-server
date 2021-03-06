node-udata
==========

> **DISCLAIMER:** This is a work-in-progress

udata provides an indepentend API for several data access patterns.
Furthermore it has a build in scheme to migrate the existing data
_without loss_ to any other udata API provider.

This common API shall help to give you control back over your data.

It's a design decision is to aim for portability instead of performance.

Push
----
The crucial point of udata is to de-couple the data from the storage
provider.
The *push* mechanism is the intended point to push the complete data
of this udata instance to another udata provider.

> **DISCLAIMER:** The push fucntionality is not yet implemented.

Basically the push mechanism shall reuse the existing API. Put in other
words: Behaves as like a client to the target udata instance.

API
---
### Semantics
udata defines APIs for the following data access patterns:

* map - For key-value patterns
* database - For an SQL pattern
* object - For an object/document based pattern (todo)
* fs - For a filesystem pattern (todo)

### Syntax

> **DISCLAIMER:** Currently only the semantics are defined.
> But the exact semantic and syntax of each pattern has also to be defined.
> And this is an _open issue_.

* map - XML to structure request and response?
* database - SQL 99, XML to structure request and response?
* object - raw
* fs - raw / webdav

Backends
--------
The backends which are used to implement the data access pattern in this
reference implementation are:

* sqlite3 (sql)
* filesystem (map, object, fs)

Alternatives:

* database
  + sqlit3
  + postgresql
* map
  + redis
* object
  + openstack-swift
* filesystem
  + httpd

Hands on
--------

> You made it to the bottom.

To run the reference implementation do:

    $ git submodule update --init
    $ pkcon install nodejs-express nodejs-sqlite3 npm
    $ npm link express
    $ npm link sqlite3
    $ node lib/app.js

And point your browser to the [webinterface](http://127.0.0.1:3000/static/index.html)
or to a [todo list example](http://127.0.0.1:3000/static/examples/todo/).

