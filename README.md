REST testing utility
====================

If you are building a RESTful API this tool is for you.
It provides a quick access to your (wip) API and nicely formats common output formats.

Installation
------------

Just clone this repository into a folder on the vhost of the API you are going to test.
That's it!

Usage
-----

Here's a screenshot: http://i.imgur.com/Zuk8X.png

To start, choose an HTTP verb to use, enter a URL and press Send. You will see
the call's output in the Response area together with all headers received.

If you need custom parameters you can add them in the according textarea.
Each line represents a key=value pair.

Example:

    foo=myvalue
    bar[]=some1
    bar[]=some2

To see a nicely formatted presentation of your API call, press the Show Output button.

Tips & Tricks
-------------

- Most fields have an accesskey set, allowing you to use the toll with almost no mouse interaction:
  - *M*ethod
  - *U*RL
  - *P*arameters
  - *S*end
  - Show/Hide *O*utput

- If you don't need some headers (I bet you don't need the Server: Apache/2..
  header all the time) you can specify those in the Ignore headers field below
  the output as a comma separated list. They will get saved in localStorage so don't worry about always setting them again.

Colophon
--------

This utility uses the following third party contents:

- Eric Meyer's famous reset.css 2.0 - http://meyerweb.com/eric/tools/css/reset/
- Yusuke Kamiyamane's awesome Fugue icons - http://p.yusukekamiyamane.com/
- John Resig's jQuery - http://jquery.com/

TODO
----

- Format XML output
- Specify additional headers for requests

**Have fun testing!**
