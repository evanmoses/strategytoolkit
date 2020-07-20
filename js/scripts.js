$(document).ready(function(){
    var targets = $('.toolcard'),
    buttons = $('.menuitem');

    buttons.click(function(){
        var value = $(this).data('toolcard');
        if(value == "all")
        {
            buttons.removeClass('checked');
            targets.show('1000');
        }
        else
        {
            if($(this).hasClass('checked'))
            {
                $(this).removeClass('checked');
                var checkedClasses = buttons.filter('.checked').toArray().map(function(btn){return $(btn).data('filter');});
                if(checkedClasses.length == 0)
                {
                    buttons.removeClass('checked');
                    targets.show('1000');
                }
                else
                {
                    checkedClasses = $.grep(checkedClasses, function(n, i){ return n != value }),
                    selector = '.' + checkedClasses.join('.'),
                    show = targets.filter(selector);
                    targets.not(show).hide('3000');
                    show.show('3000');
                }
            }
            else
            {
                $(this).addClass('checked');
                var checkedClasses = buttons.filter('.checked').toArray().map(function(btn){return $(btn).data('filter');}),
                selector = '.' + checkedClasses.join('.'),
                show = targets.filter(selector);
                targets.not(show).hide('3000');
                show.show('3000');
            }
        }
    });
});
