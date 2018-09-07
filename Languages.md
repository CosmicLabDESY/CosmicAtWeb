# Language support & translation

On the installation of the ctplot package runs the
`generate_static_files.py` routine. It takes all the template
static files (HTML, CSS & js) and inserts the translations.

Translations are taken form the `./ctplot/dict.csv` file.
This can be edited with any table manipulation program or
text editor. It is important to ensure the file is again
stored as a `csv`.

The file has the following structure, here are two translations
as an example.

English|German|Key
---|---|---
Setting of detail level|Einstellungsmodi|detail level
Detailed|Erweitert|

If no key is provided, the english text in lower case is the
fallback key.

## Template files 
### Insert translations

`./ctplot/static/index.html` is the entry point for the
static file generator. Keyed translations from
`dict.csv` will be inserted at `{{key}}`. There is also an
opportunity to insert constants and other translations 
into the translation using
C format strings [https://en.wikipedia.org/wiki/Printf_format_string].
This turned out to be especially useful when inserting HTML
text into a string. To use this feature, write `{{key % insert1,insert2}}`.
You have to ensure that the translations both have the correct amount
of `%s` included.

### Insert other static files

Other static files like CSS, js or HTML can be inserted
by writing `{{INSERT path/relative/to/ctplot/static}}`.
This step is done before inserting translations so the
inserted files themselves can be translated.

Note that the double curly brackets can be surrounded by
CSS/javascript comments like `/*{{key}}*/` at any time.
This does not change the behavior of the generator, it is
only useful for editor syntax highlighting. The comment
start/end will be removed.
