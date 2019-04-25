/**
 * Called when there was a cables error.
 * @param {string} errId - ID of the error, e.g. 'NO_WEBGL' or 'NO_WEBAUDIO'
 *                         when the browser does not support the used APIs
 * @param {string} errMsg - The error message
 */
function showError(errId, errMsg) {
    alert("An error occured: " + errId + ", " + errMsg);
}

function patchInitialized() {
    // You can now access the patch object (CABLES.patch), register variable watchers and so on
}

function patchFinishedLoading() {
    // The patch is ready now, all assets have been loaded
    setTimeout(function() {
        $(".app__loader-wrap").fadeOut("slow", function() {
            $("body").removeClass("loading");
        });
    }, 1500);
}

document.addEventListener("DOMContentLoaded", function(event) {
    CABLES.patch = new CABLES.Patch({
        patchFile: "js/app.json",
        prefixAssetPath: "",
        glCanvasId: "glcanvas",
        glCanvasResizeToWindow: true,
        onError: showError,
        onPatchLoaded: patchInitialized,
        onFinishedLoading: patchFinishedLoading
    });
});
