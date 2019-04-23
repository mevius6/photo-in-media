{
    function showError(errId, errMsg) {
        alert("An error occured: " + errId + ", " + errMsg);
    }

    function patchInitialized() {
        // You can now access the patch object (CABLES.patch), register variable watchers and so on
    }

    function patchFinishedLoading() {
        $(".app__loader").fadeOut("slow", function() {
            setTimeout(function() {
                $(".app__loader-wrap").fadeOut();
            }, 1000);
        });
    }

    document.addEventListener("DOMContentLoaded", function(event) {
        CABLES.patch = new CABLES.Patch({
            patchFile: "js/media-portrait.json",
            prefixAssetPath: "",
            glCanvasId: "glcanvas",
            glCanvasResizeToWindow: true,
            onError: showError,
            onPatchLoaded: patchInitialized,
            onFinishedLoading: patchFinishedLoading
        });
    });
}
