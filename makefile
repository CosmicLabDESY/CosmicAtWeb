all:
	if [ $CTPLOT_DEBUG ]; then make install-develop; else make install; fi

install:
	unset CTPLOT_DEBUG
	sudo python2.7 setup.py install

install-develop:
	export CTPLOT_DEBUG=true
	#-sudo python2.7 setup.py develop
	mkdir -p ctplot/static/en ctplot/static/de ctplot/static/common
	python2.7 -c "from generate_static_files import *; generate_static_files('ctplot/static')"
	python2.7 ./ctplot/webserver.py
