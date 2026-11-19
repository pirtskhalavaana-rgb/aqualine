// Set this to the GA4 web stream Measurement ID to enable the Google tag.
// This is the Measurement ID of the active "Black Friday Aqualine" GA4
// property (564804096). The older G-JX... stream belongs to the duplicate
// property and must not receive campaign interaction events.
const measurementId = 'G-N37MCE3KYW';
if (/^G-[A-Z0-9]+$/.test(measurementId)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // GTM already owns the automatic page_view. This lightweight direct tag is
  // only here to deliver the named interaction events below without creating
  // a duplicate page view.
  window.gtag('config', measurementId, { send_page_view: false });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.append(tag);
}
