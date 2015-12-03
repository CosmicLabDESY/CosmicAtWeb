/*
pyplot - python based data plotting tools
created for DESY Zeuthen
Copyright (C) 2012  Adam Lucke

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/** ajax default settings */
$.ajaxSetup({
    url : 'plot',
    dataType : 'json',
    type : 'post'
});

var speed = 'fast';

/** add .startsWith() function to string */
if ( typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return this.indexOf(str) == 0;
    };
}

/** add .foreach() to arrays */
Array.prototype.foreach = function(callback) {
    for (var k = 0; k < this.length; k++) {
        callback(k, this[k]);
    }
}
var tables_and_vars = null;

/** display warning if unsupported browser is used */
function checkBrowserSupport() {
    var unsupported = false;

    /* Safari */
    if (navigator.userAgent.indexOf('Safari') > -1 && 
        navigator.userAgent.indexOf('Chrome') == -1) 
    {
        unsupported = true;
    /* Internet Explorer */
    } else if (navigator.userAgent.indexOf('MSIE') > -1) {
        unsupported = true;
    }

    if (unsupported) {
        $('#browser-warning').show();
    } else {
        $('#browser-warning').remove();
    }
}

/** get available HDF5 from server and return new DOM element */
function sourcesBox() {
    console.debug('* sourcesbox');
    var datasetbox, experimentbox;
    $.ajax({
        async : false,
        data : {
            a : 'list'
        },
        success : function(data) {
            // console.debug(data);
            // store HDF5- infos globally
            tables_and_vars = data;

            experimentbox = $('<select>').attr('name', 'experiment*');
            $('<option>').text('(bitte Experiment auswählen)').appendTo(experimentbox);
            datasetbox = $('<select>').attr('name', 's*');
            $('<option>').text('(bitte Datensatz auswählen)').appendTo(datasetbox);

            $.each(data, function(id, info) {
                // console.debug(id+' -- '+info);
                var m = id.match(/(.*):(.*)/);
                // filename incl. path
                var file = m[1];
                // filename only, w/o path and extension
                var filename = file.match(/(.*)\/(.+)\.h5/i)[2];
                // name of the table
                var tabname = m[2];

                // add a selectable option for this dataset and table
                var opt = $('<option>').text(filename + ' - ' + info[0]).val(id).appendTo(datasetbox);

                var experiment = file.match(/(.+?\/)*(.*?)\/.+?/)[2];
                console.debug('experiment = ' + experiment + ' / ' + id);
                opt.addClass('ex-' + experiment);
                if (experimentbox.find('option').filter(function() {
                    return $(this).text() == experiment;
                }).size() < 1) {
                    var ex = $('<option>').text(experiment).val(experiment).appendTo(experimentbox);
                    if (experiment.startsWith('x'))
                        ex.addClass('expert');
                }

                if (opt.text().startsWith('x'))
                    opt.addClass('expert');
            });
        },
        error : function(xhr, text, error) {
            alert(xhr['responseText']);
        }
    });

    var experimentlabel = $('<label>').addClass('required').attr('data-help', 'Hier wird der zu verwendende Experiment ausgewählt.').append('Experiment').append(experimentbox);
    var datasetlabel = $('<label>').addClass('required').attr('data-help', 'Hier wird der zu verwendende Datensatz ausgewählt.').append('Datensatz').append(datasetbox);
    return $('<div class="datasetselector">').append(experimentlabel).append(datasetlabel);
}

/** renumber form field names after add/del of plot */
function renumberPlots() {
    console.debug('* renumber plots');
    ch = $('#plots').children('.plot');
    ch.each(function(i) {
        plot = $(this);
        plot.find('legend').text('Diagramm ' + (i + 1));
        plot.find('[name]').each(function() {
            e = $(this);
            e.attr('name', e.attr('name').replace(/\*|\d/, '' + i));
        });
        // plot.find('.delplot').prop('disabled', ch.length <= 1);
    });

    // hide/show add plot button
    if (ch.length >= 4)
        $('#addplot').hide();
    else
        $('#addplot').show();

    // hide/show twin axis dropdownbox
    if (ch.length < 2)
        $('.plot :input[name^="tw"]').parent('label').addClass('hidden');
    else
        $('.plot :input[name^="tw"]').parent('label').removeClass('hidden');

    updateHiddenFields();
}

function hide(s) {
    console.debug('* hide '+s);
    s = $(s);
    //	console.debug('hide: '+s.html());
    s.hide(speed).find(':input').prop('disabled', true);
    return s;
}

function show(s) {
    console.debug('* show '+s);
    s = $(s);
    //	console.debug('show: '+s.html());
    s.show(speed).find(':input').prop('disabled', false);
    return s;
}

/** disable/enable fields according to detaillevel and plotmode */
function updateHiddenFields() {
    console.debug('* update hidden fields');
    mode = $(':input[name="detaillevel"]').val();
    console.debug('detaillevel=' + mode);
    if (mode == 'expert') {
        tohide = 'nothing';
    } else if (mode == 'advanced') {
        tohide = '.expert';
    } else {
        tohide = '.expert, .advanced';
    }
    console.debug('tohide=' + tohide);

    visible = $('.expert,.advanced,.hidden');
    hidden = $(tohide+',.hidden');

    // twin axes global fields
    $.each(['x', 'y'], function(i, v) {
        twinv = $('.twin' + v);
        visible = visible.add(twinv);
        if ($(':input[name^="tw"] option:selected[value="' + v + '"]').size() == 0) {
            hidden = hidden.add(twinv);
        }
    });

    // field in individual plot settings
    $('.plot').each(function() {
        plot = $(this);
        // mode dependant fields
        var options = plot.find('[class*="t-"]');
        // selects all options
        var plotmode = '.t-' + plot.find(':input[name^="m"]').val();
        console.debug('plotmode=' + plotmode);
        visible = visible.add(options);
        hidden = hidden.add(options.not(plotmode));

        // shift and weight
        r = plot.find(':input[name^="rs"], :input[name^="rc"]').parents('label');
        var windowempty = plot.find(':input[name^="rw"]').val().replace(/\s+/, '') == '';
        visible = visible.add(r);
        if (windowempty) {
            hidden = hidden.add(r);
        }

        // experiment/dataset
        var experiment = '' + plot.find(':input[name^="experiment"]').val();
        console.debug('experiment=' + experiment);
        if (experiment.match(/\s+/))
            experiment = '';
        console.debug('experiment=' + experiment);
        var datasets = plot.find('option[class*="ex-"]');
        visible = visible.add(datasets);
        hidden = hidden.add(datasets.not('.ex-' + experiment));
    });

    visible = visible.not(hidden);
    console.debug('visible=' + visible.size() + ' hidden=' + hidden.size());
    show(visible);
    hide(hidden);
}

/** update axis dropdown contents for given plot */
function updateAxisVarsDropdowns(plot) {
    plot.find(':input[name^="x"],:input[name^="y"],:input[name^="z"]').each(function() {
        // only apply if input is a select box 
        if ($(this).is('select')) {
            var dropdown = $(this),
                p = $(this).parents('.plot'),
                k = p.find('select[name^="s"]').val(),
                option;

            dropdown.empty().append('<option></option>');

            $.each(tables_and_vars, function(kk, vv) {
                if (kk == k) {
                    for ( i = 0; i < vv[1].length; ++i) {
                        option = $('<option>');
                        option.val(vv[1][i]);
                        if (vv[2][i].length > 0) {
                            option.text(vv[1][i] + ' [' + vv[2][i] + ']');
                        } else {
                            option.text(vv[1][i]);
                        }
                        dropdown.append(option)
                    }
                    if (p.find(':input[name^="rw"]').val().replace(/\s+/, '') != '') {
                        dropdown.append('<option value="rate">rate</option>');
                        dropdown.append('<option value="count">count</option>');
                        dropdown.append('<option value="weight">weight</option>');
                    }
                    return false;
                }
            });
        }
    });
}

/** add interactive handlers */
function addHandlers(plot) {
    console.debug('* add handlers');
    // display available vars on certain input fields
    plot.find(':input[name^="c"]').focusin(function() {
        p = $(this).parents('.plot');
        k = p.find('select[name^="s"]').val();
        $.each(tables_and_vars, function(kk, vv) {
            if (kk == k) {
                vars = $('#vars').empty();
                for ( i = 0; i < vv[1].length; ++i) {
                    if (i > 0)
                        vars.append(', ');
                    vars.append('' + vv[1][i]);
                    if (vv[2][i].length > 0)
                        vars.append(' [' + vv[2][i] + ']');
                }
                if (p.find(':input[name^="rw"]').val().replace(/\s+/, '') != '')
                    vars.append(', rate, count, weight');
                $('#varsbox').show();
                return false;
            }
        });
    }).focusout(function() {
        $('#varsbox').hide();
    });

    // add colorpicker
    plot.find(':input[name$="color"]').each(function() {
      var input = $(this),
          parent = input.parent(),
          picker = $('<div class="colorselector"><div></div></div>')
              .attr('title', parent.data('help'));

      picker.appendTo(parent).ColorPicker({
          color: '#0000ff',
          onShow: function (cp) {
              $(cp).fadeIn(500);
              return false;
          },
          onHide: function (cp) {
              $(cp).fadeOut(500);
              return false;
          },
          onChange: function (hsb, hex, rgb) {
              input.val('#' + hex);
              picker.find('div').css('backgroundColor', '#' + hex);
          }
      });
    });

    // delete plot button
    plot.find('.delplot').click(function() {
        $(this).parents('.plot').remove();
        renumberPlots();
    });

    // plot mode dropdown box
    plot.find(':input[name^="m"]').change(function() {
        updateHiddenFields();
    });

    // rate window field
    plot.find(':input[name^="rw"]').keyup(function() {
        updateHiddenFields();
    });

    // twin axes dropdown box
    plot.find(':input[name^="tw"]').change(function() {
        updateHiddenFields();
    });

    // experiment
    plot.find(':input[name^="experiment"]').change(function() {
        console.log('experiment changed');
        updateHiddenFields();
        var selector = $(this).parents('.datasetselector')
          .find(':input[name^="s"] option:first').prop('selected', true);
        updateAxisVarsDropdowns(plot);
    });

    // datasets
    plot.find(':input[name^="s"]').change(function() {
        console.log('set changed');
        updateHiddenFields();
        updateAxisVarsDropdowns(plot);
    });

    updateHiddenFields();

    return plot;
}

/** Hilfe initialisieren */
function initHelp(el) {
    console.debug('* init help');
    $(el).find('label[data-help]').each(function() {
        help = $(this).attr('data-help');
        if (help != '')
            //			$('<img>').attr('src', 'img/help.png').attr('title', help).addClass('help').prependTo(this).hide();
            $(this).find(':input').attr('title', help);

    }).hover(function() {
        $(this).find('.help').show();
    }, function() {
        $(this).find('.help').hide();
    });
}

function getSettings() {
    console.debug('* get settings');
    s = new Object();
    $('form :input:enabled:not(:button):not(:reset):not(:submit)[name]').each(function() {
        field = $(this);
        name = field.attr('name');
        if (field.is(':checkbox')) {
            s[name] = field.prop('checked');
        } else {
            val = field.val();
            s[name] = field.val();
        }
    });
    s['plots'] = $('.plot').size();
    return s;
}

function setSettings(s) {
    var axis = {};
    console.debug('* set settings');

    for (var i = 0; i < s.plots; ++i) {
        addPlot();
    }

    $.each(s, function(k, v) {
        if (k.match(/^[xyz][0-9]+$/)) {
            axis[k] = v;
        } else {
            field = $(':input[name="' + k + '"]');
            if (field.is(':checkbox')) {
                field.prop('checked', v);
            } else {
                field.val(v);
            }
        }
    });

    var plots = $('.plot');

    /* since we know the dataset now, we can populate the 
     *  axis select boxes */
    plots.each(function () {
        updateAxisVarsDropdowns($(this));
    });

    /* select the axis values */
    $.each(axis, function(k, v) {
        var field = $(':input[name="' + k + '"]');
        field.val(v);
    });

    updateHiddenFields();
}

function initSettingsLoader() {
    console.debug('* init settnings loader');
    $(':button[name="load"]').click(function() {
        try {
            s = JSON.parse($(':input[name="settingstoload"]').val());
            $('nav a[href="#settings"]').click();
            setSettings(s);
            // $('form').submit();
        } catch (e) {
            alert('Fehler beim Laden der Einstellungen: ' + e);
        }
    });
}

function initExpertMode() {
    console.debug('* init expert mode');
    // add handler to expertmode checkbox
    $('select[name="detaillevel"]').click(updateHiddenFields);
    updateHiddenFields();
}

var templatePlot;


function initPlots() {
    console.debug('* init plots');
    // add source dropdown box to plot template, filled with available hdf5 data files
    sourcesBox().prependTo('.plot');
    // detach the plot template (to be added by pressing 'add plot' button)
    templatePlot = $('.plot').detach();

    $('#varsbox').hide();

    $('#addplot').click(addPlot);
    
    $.cookie('lastsettings','', { expires: -1 });
    $.cookie('session','', { expires: -1 });
    
    try {
//        setSettings(JSON.parse($.cookie('lastsettings')));
        setSettings(simpleStorage.get('settings'));
    } catch (e) {
        addPlot();
    }
}

function addPlot() {
    console.debug('* add plot');
    if ($('.plot').size() == 0)
        newplot = templatePlot.clone()
    else
        newplot = $('.plot:first').clone();
    newplot.find('*').removeAttr('style');
    newplot.appendTo('#plots');
    $('#addplot').appendTo('#plots');
    renumberPlots();
    addHandlers(newplot);
    initHelp(newplot);
    updateHiddenFields();
}

function initScroll() {
    console.debug('* init scroll');
    // let navbar smoothscroll
    $('nav a').smoothScroll({
        offset : -15
    });

    // detach navbar on scroll down
    $(window).scroll(function() {
        scroll = $(this).scrollTop();
        nav = $('nav:not(.fixed)');
        if (nav.size() > 0)
            navoffset = nav.offset();
        if (scroll > navoffset.top) {
            $('nav').addClass('fixed').next().css('margin-top', $('nav').height());
        } else {
            $('nav').removeClass('fixed').next().css('margin-top', '0');
        }

        pos = scroll + $('nav').height();
        $('nav a').removeClass('active').each(function() {
            target = $(this).attr('href');
            offset = $(target).offset();
            height = $(target).height();

            if (offset.top <= pos && pos < offset.top + height) {
                $(this).addClass('active');
                return false;
            }
        })
    }).scroll();

    // set section size to viewport size
    $(window).resize(function() {
        $('#content > div').css('min-height', $(this).height());
    }).resize();
}

function getSessionID() {
    console.debug('* get session id');
//    id = $.cookie('session');
    id = simpleStorage.get('session');
    if (id != null)
        $('#sessionid').val(id);
    else
        newSessionID();
    return $('#sessionid').val();
}

function newSessionID() {
    console.debug('* new session id');
    $.ajax({
        async : false,
        data : {
            a : 'newid',
        },
        dataType : 'text',
        success : function(data, status, xhr) {
            $('#sessionid').val(data);
//            $.cookie('session', data);
            simpleStorage.set('session', data);
        }
    });
}

function initSavedPlots() {
    console.debug('* init saved plots');
    getSessionID();
    $('#newid').click(function() {
        newSessionID();
        loadPlots();
    });
    $('#loadid').click(function() {
        id = $('#sessionid').val();
        if (id.length < 8) {
            alert('Die Session-ID muss mindestens 8 Zeichen lang sein.');
            return;
        }
//        $.cookie('session', id);
        simpleStorage.set('session', id);
        loadPlots();
    });
    $('#sessionid').keyup(function(e) {
        if (e.keyCode == 13) {
            $('#loadid').click();
        }
    });
    loadPlots();
}

function savePlots() {
    console.debug('* save plots');
    o = new Object();
    o.savedPlots = [];
    $('.savedplot').each(function() {
        o.savedPlots.push($(this).data('settings'));
    });
    $.ajax({
        async : false,
        data : {
            a : 'save',
            id : getSessionID(),
            data : JSON.stringify(o)
        },
        // success : function(data, status, xhr) {
        // $('#debug').empty().append('' +
        // o).append('<br>').append(''+status).append('<br>').append(''+xhr);
        // },
        error : function(xhr, text, error) {
            alert('saving plots failed ' + xhr['responseText']);
        }
    });
}

function loadPlots() {
    console.debug('* load plots');
    $('#savedplots').empty();
    $.ajax({
        async : false,
        data : {
            a : 'load',
            id : getSessionID(),
        },
        success : function(o, status, xhr) {
            // $('#debug').empty().append('' + o).append('<br>').append('' +
            // status).append('<br>').append('' + xhr);
            $.each(o.savedPlots, function(i, s) {
                addPlotToSaved(s);
            });
        },
        // error : function(xhr, text, error) {
        // alert('loading plots failed ' + xhr['responseText'] + ' ' + text + ' ' +
        // error);
        // }
    });
}

function bindColorbox() {
    console.debug('* bind colorbox');
    $('#savedplots .savedplot').unbind().colorbox({
        photo : true,
        maxWidth : '90%',
        maxHeight : '90%',
        rel : 'plots',
        title : 'gespeichertes Diagramm'
    });
}

function addPlotToSaved(settings) {
    console.debug('* add plot to saved');
    $('<div>').appendTo('#savedplots').append($('<img src="' + settings.url + '" href="' + settings.url + '" title="' + settings.t + '">').addClass('savedplot').data('settings', settings))
    // add delete button
    .append($('<img>').attr('src', 'img/cross.png').attr('title', 'Plot löschen').addClass('delete').click(function() {
        $(this).parent().remove();
        bindColorbox();
        savePlots();
    }))
    // add load button
    .append($('<img>').attr('src', 'img/arrow_redo.png').attr('title', 'Plot laden').addClass('loadplot').click(function() {
        setSettings($(this).parent().find('.savedplot').data('settings'));
        $('form').submit();
    }));

    bindColorbox();
}

var xhr;

function transformMinMaxFields() {
    console.debug('* transform min/max');
    $('.global input[name$="-min"]').each(function(){
        input = $(this);
        target = input.attr('name').match(/(.+)-(.+)/)[1];
//        console.debug(input.attr('name')+' = '+input.val() + '   ' + target + ' = ' + input.val());
        target = $(':input[name="'+target+'"]');
        target.val(input.val());
    });
    $('.global input[name$="-max"]').each(function(){
        input = $(this);
        target = input.attr('name').match(/(.+)-(.+)/)[1];
//        console.debug(input.attr('name')+' = '+input.val() + '   ' + target + ' = ' + input.val());
        target = $(':input[name="'+target+'"]');
        target.val(target.val()+', '+input.val());
        if(target.val().match(/^\s*,\s*$/))
            target.val('');
        console.debug(target.attr('name')+' = '+target.val());
    });
}

function initSubmit() {
    console.debug('* init submit');
    // hand submission of plot request and reception of the plot
    $('form').submit(function() {
        try {// abort previous request
            xhr.abort();
        } catch (e) {
            // if there was no previous request, ignore errors
        }

        // the form (all input fields) as url query string

        transformMinMaxFields();

        query = $('form').serialize();
        settings = getSettings();
//        $.cookie('lastsettings', JSON.stringify(settings));
        simpleStorage.set('settings', settings);

        // store current plot settings (all input fields) into 
        // settings object

        result = $('#result');
        // print status information
        result.empty().append('<p>Plot wird erstellt, bitte warten&hellip;</p><img src="img/bar90.gif">');

        // scroll to plot section
        $('nav a[href="#output"]').click();

        // perform ajax request to get the plot (created on
        // server)
        $('#error').empty();
        xhr = $.ajax({
            data : query,
            success : function(data) {
                var saveButton,
                    img = data.png;

                result.empty();

                $('<img>').attr('src', img)
                // add query string to prevent browser
                // from showing cached image
                    .attr('alt', query).appendTo(result);

                // links to pdf and svg
                p = $('<p>').appendTo(result);
                p.append('Download als ');
                $('<a>').attr('href', data.pdf)
                    .attr('target', '_blank').text('PDF').appendTo(p);
                p.append(', ');
                $('<a>').attr('href', data.svg)
                    .attr('target', '_blank').text('SVG').appendTo(p);
                p.append(', ');
                $('<a>').attr('href', data.png)
                    .attr('target', '_blank').text('PNG').appendTo(p);
                p.append('&nbsp;');

                // save plot button
                saveButton = $('<button>').attr('type', 'button')
                    .attr('title', 'Zu gespeicherten Diagrammen hinzufügen')
                    .text(' Zu gespeicherten Diagrammen hinzufügen');
                $('<img>').attr('src', 'img/disk.png').prependTo(saveButton);
                
                saveButton.click(function () {
                    addPlotToSaved(settings);
                    $(this).hide(speed);
                    savePlots();
                    scrollToElement('#savedplots');
                }).appendTo(p);

                // plot settings
                result.append('<h2>Einstellungen dieses Plots</h2>');
                jsonsettings = JSON.stringify(settings);
                result.append($('<textarea id="plotsettings">').text(jsonsettings));

                // plot url
                result.append('<h2>Diesen Plot auf einer Webseite einbinden</h2>');
                ploturl = $(location).attr('href').replace(/[#?].*/, '') + 'plot?' + query.replace(/a=plot/, 'a=png');
                result.append($('<textarea id="ploturl">').text('<img src="' + ploturl + '" />'));

                // store settings in cookie
                $.extend(settings, data);
                // append plot image urls to
                settings['url'] = ploturl;

                // scroll to plot section
                $('nav a[href="#output"]').click();
            },
            error : function(xhr, text, error) {
                $('#result').empty();
                $('#error').html('<p>plot error, check input values!</p>' + '<p>"' + text + '"</p><p>"' + error + '"</p>' + '<p style="color: red;">responseText:</p>' + xhr['responseText']);
                // scroll to plot section
                $('nav a[href="#output"]').click();
            }
        });

        return false;
    });
}

function appendSymbol(selector, symbol) {
    console.debug('* append symbol');
    $(selector).each(function() {
        var t = $(this).contents().first()
        if (t.get(0).nodeType != 3)// if it's not a text node
            return;
        t.after(' <span class="symbol">' + symbol + '</span>');
    });
}

function initSymbols() {
    console.debug('* init symbols');
    appendSymbol('label.required', '&diams;');
    appendSymbol('label.advanced', '&dagger;');
    appendSymbol('label.expert', '&Dagger;');
}

function scrollToElement(el) {
    var pos = $(el).offset().top - 15;
    $('html, body').animate({ 
        scrollTop: (pos > 0 ? pos : 0)
    }, 400);
}

/** on page load... */
$(function() {
    console.debug('* main');
    checkBrowserSupport();
    initScroll();
    initHelp('fieldset.global');
    initHelp('fieldset.global2');
    initExpertMode();
    initPlots();
    initSubmit();
    initSettingsLoader();
    initSavedPlots();
//    initSymbols();
});
