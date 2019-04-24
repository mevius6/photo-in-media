$(window).on("load", function() {
    setTimeout(function() {
        $(".app__loader-wrap").fadeOut("slow", function() {
            $("body").removeClass("loading");
        });
    }, 1500);
});