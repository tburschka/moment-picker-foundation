(function($, undefined) {

    var pluginName = 'MomentPicker';
    var today = moment().startOf('day');
    var currentLocale = navigator.language || navigator.userLanguage || 'en';
    var defaults = {
        date : today,
        locale: currentLocale,
        level: 0,
        style: {
            selected: 'selected',
            current : 'current'
        }
    };

    $.fn[pluginName] = function(options) {

        var plugin = $(this).data(pluginName);
        if(plugin) {
            return plugin;
        }

        return this.each(function() {

            var api;
            var settings = $.extend(true, {}, defaults, options);

            // enforce locale
            moment.locale(settings.locale);
            settings.date.locale(settings.locale);

            var showedDate = settings.date;
            var selectedDate = showedDate.clone();
            var picker = $(this);
            var _level = settings.level;

            if (picker.is('input[type="text"]') || picker.is('input[type="date"]')) {
                var input = picker;
                input.on('click focus', function() { showPicker(); });

                var container = $('<div class="mp">');
                container.hide();
                picker.after(container);
                picker = container;
                $(document).on('mousedown', function(e) {
                    // if the target of the click isn't the container nor a descendant of the container
                    if (!picker.is(e.target) && picker.has(e.target).length === 0)
                    {
                        picker.hide();
                    }
                });
            } else {
                picker.addClass("mp");
            }

            picker.html([
                '<div class="mp-header">',
                    '<a class="mp-prev"></a>',
                    '<a class="mp-current"></a>',
                    '<a class="mp-next"></a>',
                '</div>',
                '<div class="mp-body"></div>'
            ].join(''));

            var header = picker.children('div.mp-header');
            var body = picker.children('div.mp-body');
            var next = header.children('a.mp-next');
            var prev = header.children('a.mp-prev');
            var currentLevel = header.children('a.mp-current');

            var falsy = function() {
                return false;
            };

            var dayBeforeMin = falsy,
                dayAfterMax = falsy,
                monthBeforeMin = falsy,
                monthAfterMax = falsy,
                yearBeforeMin = falsy,
                yearAfterMax = falsy,
                getMin = falsy,
                getMax = falsy;

            var showPicker = function() {
                if (input.val() !== "") {
                    val(moment(input.val(), 'L'));
                }
                render(2);
                picker.show();
            };

            var setMin = function(o) {
                if (o instanceof Function) {
                    getMin = o;
                } else {
                    (function() {
                        var min = moment(o);
                        if (moment.isMoment(min)) {
                            min.startOf('day');
                            getMin = function() {
                                return min.clone();
                            };
                        }
                    })();
                }

                yearBeforeMin = function(year) {
                    return year < getMin().year();
                };

                monthBeforeMin = function(date) {
                    return date.clone().startOf('month') < getMin().startOf('month');
                };

                dayBeforeMin = function(date) {
                    return date < getMin();
                };

                var min = getMin();
                if (min > selectedDate) {
                    val(min);
                } else {
                    render();
                }
            };

            var setMax = function(o) {
                if (o instanceof Function) {
                    getMax = o;
                } else {
                    (function() {
                        var max = moment(o);
                        if (moment.isMoment(max)) {
                            max.startOf('day');
                            getMax = function() {
                                return max.clone();
                            };
                        }
                    })();
                }

                yearAfterMax = function(year) {
                    return year > getMax().year();
                };

                monthAfterMax = function(date) {
                    return date.clone().startOf('month') > getMax().startOf('month');
                };

                dayAfterMax = function(date) {
                    return date > getMax();
                };

                var max = getMax();

                if (max < selectedDate) {
                    val(max);
                } else {
                    render();
                }
            };

            var emit = function(name) {
                var event = $.Event(name);
                event.api = api;
                picker.trigger(event);
            };

            var allowedYear = function(year) {
                return !yearBeforeMin(year) && !yearAfterMax(year);
            };

            var allowedDay = function(date) {
                return !dayBeforeMin(date) && !dayAfterMax(date);
            };

            var allowedMonth = function(date) {
                return !monthBeforeMin(date) && !monthAfterMax(date);
            };

            var val = function() {
                if (arguments.length > 0) {
                    var date = moment(arguments[0]);
                    if (date.isValid()) {
                        date.startOf('day');
                        if (allowedDay(date)) {
                            selectedDate = date;
                            emit('pick');
                            showedDate = selectedDate.clone();
                            render();
                        }
                    }
                    return api;
                }
                return selectedDate.clone();
            };

            var renderYears = function() {
                var a = showedDate.year();
                var b = a + 12;
                var html = '';
                currentLevel.text(a + ' - ' + (b - 1));
                while (a < b) {
                    var classes = [];
                    if (a === today.year()) {
                        classes.push(settings.style.current);
                    }
                    if (a === selectedDate.year()) {
                        classes.push(settings.style.selected);
                    }

                    var type = allowedYear(a) ? 'a' : 'span';

                    html += '<' + type + ' data-year="' + a + '" class="' + classes.join(' ') + '">' + a + '</' + type + '>';
                    a++;
                }

                body.html(html);
                emit('renderYears');
            };

            var renderMonths = function() {
                var a = showedDate.clone().startOf('y');
                var b = a.clone().add(12, 'M');
                var html = '';

                currentLevel.text(a.year());

                while (a < b) {
                    var classes = [];
                    if (a.format('M-YYYY') === today.format('M-YYYY')) {
                        classes.push(settings.style.current);
                    }

                    if (a.format('M-YYYY') === selectedDate.format('M-YYYY')) {
                        classes.push(settings.style.selected);
                    }

                    var type = allowedMonth(a) ? 'a' : 'span';

                    html += '<' + type + ' data-month="' + a.format('M-YYYY') + '" class="' + classes.join(' ') + '">' + a.format('MMM') + '</' + type + '>';
                    a.add(1, 'M');
                }

                body.html(html);
                emit('renderMonths');
            };

            var renderDays = function() {
                var a = showedDate.clone().startOf('w');
                var b = a.clone().add(1, 'w');
                var html = '<div class="week">';

                currentLevel.text(showedDate.format('MMMM YYYY'));

                while (a < b) {
                    html += '<span>' + a.format('ddd') + '</span>';
                    a.add(1, 'd');
                }

                html += '</div>';

                a = showedDate.clone().startOf('M').startOf('w');
                b = a.clone().add(42, 'd');
                html += '<div class="month">';
                var isNext = false;

                while (a < b) {
                    var classes =  [];
                    if (a.format('D-M-YYYY') === today.format('D-M-YYYY')) {
                        classes.push(settings.style.current);
                    }
                    if (a.format('D-M-YYYY') === selectedDate.format('D-M-YYYY')) {

                        classes.push(settings.style.selected);
                    }

                    var type = allowedDay(a) ? 'a' : 'span';
                    if (a.month() !== showedDate.month()) {
                        classes.push(isNext ? 'mp-next' : 'mp-prev');
                    } else {
                        isNext = true;
                    }

                    html += '<' + type + ' data-day="' + a.format('D-M-YYYY') + '" class="' + classes.join(' ') + '">' + a.date() + '</' + type + '>';
                    a.add(1, 'd');
                }

                html += '</div>';

                body.html(html);
                emit('renderDays');
            };

            var args = [
                {years: 12},
                {years: 1},
                {months: 1}
            ];

            var renderer = [renderYears, renderMonths, renderDays];

            var render = function() {
                if (arguments.length > 0) {
                    _level = Math.max(arguments[0], settings.level);
                }

                picker.removeClass('top');

                if (_level === settings.level) {
                    picker.addClass('top');
                }

                renderer[_level]();
                emit('render');
            };

            var showNext = function() {
                var unit   = Object.keys(args[_level])[0],
                    amount = args[_level][unit];
                showedDate.add(amount, unit);
                render();
                emit('showNext');
            };

            var showPrev = function() {
                var unit   = Object.keys(args[_level])[0],
                    amount = args[_level][unit];
                showedDate.subtract(amount, unit);
                render();
                emit('showPrev');
            };

            next.click(showNext);
            prev.click(showPrev);

            currentLevel.click(function() {
                render(Math.max(0, --_level));
            });

            body.on('click', 'a[data-year]', function() {
                showedDate.year($(this).data('year'));
                render(1);
            });

            body.on('click', 'a[data-month]', function() {
                var date = moment($(this).data('month'), 'M-YYYY');
                showedDate.month(date.month()).year(date.year());
                render(2);
            });

            body.on('click', 'a[data-day]', function() {
                val(moment($(this).data('day'), 'D-M-YYYY'));
                if (input) {
                    input.val(selectedDate.format('L'));
                    picker.hide();
                }
            });

            var min = function() {
                if (arguments.length > 0) {
                    setMin(arguments[0]);
                    return api;
                }

                return getMin();
            };

            var max = function() {
                if (arguments.length > 0) {
                    setMax(arguments[0]);
                    return api;
                }
                return getMax();
            };

            api = {
                val         : val,
                next        : showNext,
                prev        : showPrev,
                min         : min,
                max         : max,
                renderYears : function () { render(0); },
                renderMonths: function () { render(1); },
                renderDays  : function () { render(2); }
            };

            if (settings.hasOwnProperty('min')) {
                setMin(settings.min);
            }

            if (settings.hasOwnProperty('max')) {
                setMax(settings.max);
            }

            picker.data(pluginName, api);

            emit('ready');
            render();
        });
    };
})(jQuery);
