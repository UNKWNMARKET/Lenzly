import UIKit
import Capacitor
import WebKit

/// Custom bridge view controller that forces full-width tablet rendering on iPad.
/// The Capacitor config sets preferredContentMode but this native override
/// ensures it applies even if the config file is not synced.
class ViewController: CAPBridgeViewController {

    override open func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        if UIDevice.current.userInterfaceIdiom == .pad {
            // Force the web content to use the full iPad viewport width
            // so CSS media queries (md: breakpoints) fire correctly.
            let prefs = WKWebpagePreferences()
            prefs.preferredContentMode = .recommended
            configuration.defaultWebpagePreferences = prefs
        }
        return super.webView(with: frame, configuration: configuration)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Inject a JS snippet on iPad that rewrites the viewport meta tag
        // to guarantee width=device-width at the true screen resolution.
        if UIDevice.current.userInterfaceIdiom == .pad {
            let script = WKUserScript(
                source: """
                (function() {
                    var meta = document.querySelector('meta[name=viewport]');
                    if (meta) {
                        meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
                    }
                })();
                """,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            webView?.configuration.userContentController.addUserScript(script)
        }
    }
}
