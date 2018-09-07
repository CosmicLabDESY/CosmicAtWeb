#!/usr/bin/env python
# coding: utf8
import os
import tables
import json
from collections import OrderedDict
from time import time
from plot import TableSpecs

day_in_seconds = 86400


class GlobalData:
    def __init__(self, datadir=os.path.join(os.path.dirname(__file__), 'data')):
        self.__sessions = None
        self.__timestamp = 0
        self.__datadir = datadir
        self.__tables = None

    def __update(self):
        if not self.__sessions or not self.__tables or time() - self.__timestamp > day_in_seconds:
            # collect files
            files = []

            for d, _, fl in os.walk(self.__datadir):
                files.extend(map(lambda fn: (fn, os.path.join(d, fn)), fl))

            # update session data
            session_file_ext = '.session.json'
            session_files = filter(lambda fn, _: fn.endswith(session_file_ext), files)
            session_dict = {}

            for fn, fpath in session_files:
                session_id = fn[:-len(session_file_ext)]
                with open(fpath, 'r') as f:
                    session_dict[session_id] = f.read()

            self.__sessions = session_dict

            # update table data
            table_files = filter(lambda fn, _: fn.lower().endswith('.h5'), files)
            table_files.sort()
            tabs = OrderedDict()

            for fn, fpath in table_files:
                try:
                    h5 = tables.openFile(fpath, 'r')
                    for n in h5.walkNodes(classname='Table'):
                        tab = fn + ':' + n._v_pathname
                        tabs[tab] = TableSpecs(n._v_title, n.colnames, json.loads(n.attrs.units), int(n.nrows))
                    h5.close()
                except:
                    pass

            self.__tables = tabs
            self.__timestamp = time()

    def get_sessions(self):
        self.__update()

        return self.__sessions

    def get_tables(self):
        self.__update()

        return self.__tables
