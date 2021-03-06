{
	const supportsCssVars = function () {
		return window.CSS && CSS.supports("font-size", "var(--fs-bs)")
	}

	const canvas = document.getElementById("glcanvas")

	const main = document.querySelector("main")

	const mql = window.matchMedia("(max-width: 600px)")

	if (supportsCssVars()) {
		function deviceWidth(e) {
			if (e.matches) {
				window.onload = function () {
					document.body.classList.remove('loading')
				}
				canvas.classList.add("hidden");
				main.classList.remove("hidden")
			} else {
				/**
				 * Called when there was a cables error.
				 * @param {string} errId - ID of the error, e.g. 'NO_WEBGL' or 'NO_WEBAUDIO'
				 * when the browser does not support the used APIs
				 * @param {string} errMsg - The error message
				 */
				function showError(errId, errMsg) {
					alert("An error occured: " + errId + ", " + errMsg)
				}

				function patchInitialized() {
					// You can now access the patch object (CABLES.patch), register variable watchers and so on
				}

				function patchFinishedLoading() {
					// The patch is ready now, all assets have been loaded
					document.body.classList.remove('loading')
				}

				document.addEventListener("DOMContentLoaded", function (event) {
					CABLES.patch = new CABLES.Patch({
						patch: CABLES.exportedPatch,
						prefixAssetPath: "img",
						glCanvasId: "glcanvas",
						glCanvasResizeToWindow: true,
						onError: showError,
						onPatchLoaded: patchInitialized,
						onFinishedLoading: patchFinishedLoading
					})
				})
			}
		}

		deviceWidth(mql)
		mql.addListener(deviceWidth)

		mql.onchange = function () {
			console.log(mql)
		}
	} else {
		alert("Пожалуйста, просмотрите этот вебсайт в современном браузере, который поддерживает переменные CSS.")
	}
}